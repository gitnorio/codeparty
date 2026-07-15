"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

import { FeedbackBanner } from "@/components/app/feedback";
import { useLanguage } from "@/components/app/language-provider";
import { PortfolioEditorCard, type PortfolioEditorFormData } from "@/components/app/portfolio-editor-card";
import { PortfolioPageView } from "@/components/app/portfolio-page-view";
import type { PortfolioPageData } from "@/lib/portfolio";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const MAX_RESUME_SIZE_BYTES = 500 * 1024;
const PORTFOLIO_RESUME_BUCKET = "portfolio-resumes";

export default function PortfolioOwnerPage() {
  const supabase = getSupabaseBrowserClient();
  const { language } = useLanguage();
  const [portfolio, setPortfolio] = useState<PortfolioPageData | null>(null);
  const [formData, setFormData] = useState<PortfolioEditorFormData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [pendingResumeFile, setPendingResumeFile] = useState<File | null>(null);
  const [removeResumeOnSave, setRemoveResumeOnSave] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadPortfolio() {
      setIsLoading(true);
      setErrorMessage(null);

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (!mounted) {
        return;
      }

      if (sessionError) {
        setErrorMessage(sessionError.message);
        setIsLoading(false);
        return;
      }

      if (!session?.access_token) {
        window.location.href = "/";
        return;
      }

      const response = await fetch("/api/portfolio/me", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const payload = (await response.json()) as
        | { data?: PortfolioPageData; error?: string }
        | undefined;

      if (!mounted) {
        return;
      }

      if (!response.ok || !payload?.data) {
        setErrorMessage(
          payload?.error ??
            (language === "fr"
              ? "Impossible de charger votre portfolio."
              : "Unable to load your portfolio.")
        );
        setIsLoading(false);
        return;
      }

      setPortfolio(payload.data);
      setFormData(createFormData(payload.data));
      setPendingResumeFile(null);
      setRemoveResumeOnSave(false);
      setIsLoading(false);
    }

    void loadPortfolio();

    return () => {
      mounted = false;
    };
  }, [language, supabase]);

  const feedback = useMemo(() => {
    if (errorMessage) {
      return <FeedbackBanner tone="error" message={errorMessage} />;
    }

    if (successMessage) {
      return <FeedbackBanner tone="success" message={successMessage} />;
    }

    return null;
  }, [errorMessage, successMessage]);

  async function persistPortfolio(nextFormData: PortfolioEditorFormData, successText: string) {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.access_token) {
      setErrorMessage(
        sessionError?.message ??
          (language === "fr"
            ? "Votre session a expiré. Veuillez vous reconnecter."
            : "Your session expired. Please sign in again.")
      );
      return false;
    }

    const response = await fetch("/api/portfolio/me", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        bio: nextFormData.bio,
        location: nextFormData.location,
        language: nextFormData.language,
        resume_path: nextFormData.resume_path,
        timezone: nextFormData.timezone,
        show_location_on_portfolio: nextFormData.show_location_on_portfolio,
        show_timezone_on_portfolio: nextFormData.show_timezone_on_portfolio,
        skills: nextFormData.skills,
        project_type: nextFormData.project_types,
      }),
    });

    const payload = (await response.json()) as
      | { data?: PortfolioPageData; error?: string }
      | undefined;

    if (!response.ok || !payload?.data) {
      setErrorMessage(
        payload?.error ??
          (language === "fr"
            ? "Impossible d’enregistrer votre portfolio."
            : "Unable to save your portfolio.")
      );
      return false;
    }

    setPortfolio(payload.data);
    setFormData(createFormData(payload.data));
    setPendingResumeFile(null);
    setRemoveResumeOnSave(false);
    setSuccessMessage(successText);
    return true;
  }

  async function handleSave() {
    if (!formData) {
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      setErrorMessage(
        sessionError?.message ??
          (language === "fr"
            ? "Votre session a expiré. Veuillez vous reconnecter."
            : "Your session expired. Please sign in again.")
      );
      setIsSaving(false);
      return;
    }

    let nextResumePath = formData.resume_path;

    if (removeResumeOnSave && formData.resume_path) {
      const deleteResult = await supabase.storage
        .from(PORTFOLIO_RESUME_BUCKET)
        .remove([formData.resume_path]);

      if (deleteResult.error) {
        setErrorMessage(deleteResult.error.message);
        setIsSaving(false);
        return;
      }

      nextResumePath = null;
    }

    if (pendingResumeFile) {
      const resumePath = `${session.user.id}/resume.pdf`;
      const uploadResult = await supabase.storage
        .from(PORTFOLIO_RESUME_BUCKET)
        .upload(resumePath, pendingResumeFile, {
          upsert: true,
          contentType: "application/pdf",
        });

      if (uploadResult.error) {
        setErrorMessage(uploadResult.error.message);
        setIsSaving(false);
        return;
      }

      nextResumePath = resumePath;
    }

    const success = await persistPortfolio(
      {
        ...formData,
        resume_path: nextResumePath,
      },
      removeResumeOnSave
        ? language === "fr"
          ? "Portfolio mis à jour et CV supprimé."
          : "Portfolio updated and resume removed."
        : pendingResumeFile
          ? language === "fr"
            ? "Portfolio mis à jour et CV importé."
            : "Portfolio updated and resume uploaded."
          : language === "fr"
            ? "Portfolio mis à jour."
            : "Portfolio updated."
    );
    if (success) {
      setIsEditing(false);
    }
    setIsSaving(false);
  }

  async function handleResumeSelected(file: File | null) {
    if (!file || !formData) {
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);

    if (file.type !== "application/pdf") {
      setErrorMessage(language === "fr" ? "Le CV doit être un PDF." : "Resume must be a PDF.");
      return;
    }

    if (file.size > MAX_RESUME_SIZE_BYTES) {
      setErrorMessage(
        language === "fr" ? "Le CV doit faire 500 Ko maximum." : "Resume must be 500 KB or smaller."
      );
      return;
    }

    setPendingResumeFile(file);
    setRemoveResumeOnSave(false);
  }

  function handleResumeDelete() {
    if (pendingResumeFile) {
      setPendingResumeFile(null);
      setRemoveResumeOnSave(false);
      return;
    }

    if (formData?.resume_path) {
      setRemoveResumeOnSave(true);
    }
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fbfaff] px-4 py-8 text-[#1f1c38] dark:bg-[#0d0d12] dark:text-[#f2f2f5]">
        <div className="rounded-[1.8rem] border border-[#ece8f8] bg-white px-8 py-10 text-center shadow-[0_20px_70px_rgba(113,87,255,0.08)] dark:border-[#27272f] dark:bg-[#16161d]">
          <div className="flex items-center justify-center gap-3">
            <Loader2 className="size-5 animate-spin text-[#7650ff]" />
            <p className="text-sm text-app-secondary">
              {language === "fr" ? "Chargement de votre portfolio..." : "Loading your portfolio..."}
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!portfolio || !formData) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fbfaff] px-4 py-8 text-[#1f1c38] dark:bg-[#0d0d12] dark:text-[#f2f2f5]">
        <div className="w-full max-w-xl rounded-[1.8rem] border border-[#ece8f8] bg-white p-6 shadow-[0_20px_70px_rgba(113,87,255,0.08)] dark:border-[#27272f] dark:bg-[#16161d]">
          {feedback ?? (
            <FeedbackBanner
              tone="error"
              message={
                language === "fr"
                  ? "Impossible de charger votre portfolio."
                  : "Unable to load your portfolio."
              }
            />
          )}
        </div>
      </main>
    );
  }

  return (
    <PortfolioPageView
      data={portfolio}
      isOwner
      feedback={feedback}
      headerActions={{
        copiedLabel: language === "fr" ? "Copier le lien du portfolio" : "Copy portfolio link",
        primaryButtonLabel: isEditing
          ? language === "fr"
            ? "Fermer l’éditeur"
            : "Close editor"
          : language === "fr"
            ? "Modifier le portfolio"
            : "Edit portfolio",
        onPrimaryAction: () => {
          setErrorMessage(null);
          setSuccessMessage(null);
          setIsEditing((current) => !current);
        },
      }}
      editor={
        isEditing ? (
          <PortfolioEditorCard
            formData={formData}
            onChange={setFormData}
            onResumeSelected={(file) => void handleResumeSelected(file)}
            onResumeDelete={handleResumeDelete}
            onCancel={() => {
              setFormData(createFormData(portfolio));
              setPendingResumeFile(null);
              setRemoveResumeOnSave(false);
              setErrorMessage(null);
              setSuccessMessage(null);
              setIsEditing(false);
            }}
            onSave={() => void handleSave()}
            isSaving={isSaving}
            resumeLabel={getResumeLabel({
              pendingResumeFile,
              removeResumeOnSave,
              resumePath: formData.resume_path,
              language,
            })}
            hasResume={
              Boolean(pendingResumeFile) || (Boolean(formData.resume_path) && !removeResumeOnSave)
            }
          />
        ) : null
      }
    />
  );
}

function createFormData(data: PortfolioPageData): PortfolioEditorFormData {
  return {
    bio: data.profile.bio ?? "",
    location: data.profile.location ?? "",
    resume_path: data.profile.resume_path ?? null,
    show_location_on_portfolio: data.profile.show_location_on_portfolio,
    language: data.profile.language,
    timezone: data.profile.timezone,
    show_timezone_on_portfolio: data.profile.show_timezone_on_portfolio,
    skills: data.profile.skills,
    project_types: data.profile.project_type,
  };
}

function getResumeLabel({
  pendingResumeFile,
  removeResumeOnSave,
  resumePath,
  language,
}: {
  pendingResumeFile: File | null;
  removeResumeOnSave: boolean;
  resumePath: string | null;
  language: "en" | "fr";
}) {
  if (pendingResumeFile) {
    return pendingResumeFile.name;
  }

  if (removeResumeOnSave) {
    return language === "fr"
      ? "Le CV sera supprimé lors de l’enregistrement."
      : "Resume will be removed when you save.";
  }

  if (resumePath) {
    return resumePath.split("/").pop() ?? (language === "fr" ? "CV importé" : "Resume uploaded");
  }

  return language === "fr" ? "Aucun CV importé pour le moment" : "No resume uploaded yet";
}
