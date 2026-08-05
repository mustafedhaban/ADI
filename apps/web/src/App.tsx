import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { DashboardPage } from "@/pages/DashboardPage";
import { LibraryPage } from "@/pages/LibraryPage";
import { ReferenceDetailPage } from "@/pages/ReferenceDetailPage";
import { ReferenceFormPage } from "@/pages/ReferenceFormPage";
import { ImportPage } from "@/pages/ImportPage";
import { QuickUrlImportPage } from "@/pages/QuickUrlImportPage";
import { CollectionsPage } from "@/pages/CollectionsPage";
import { CollectionDetailPage } from "@/pages/CollectionDetailPage";
import { ProjectsPage } from "@/pages/ProjectsPage";
import { ProjectDetailPage } from "@/pages/ProjectDetailPage";
import { ConceptsIndexPage } from "@/concepts/ConceptsIndexPage";
import { TechnologyAuthorityPage } from "@/concepts/TechnologyAuthorityPage";
import { CreativeTechnologyPage } from "@/concepts/CreativeTechnologyPage";
import { AiFirstPage } from "@/concepts/AiFirstPage";
import { HumanCenteredPage } from "@/concepts/HumanCenteredPage";
import { AfricaGlobalPage } from "@/concepts/AfricaGlobalPage";
import { Round2IndexPage } from "@/concepts/round2/Round2IndexPage";
import { AiEditorialPage } from "@/concepts/round2/AiEditorialPage";
import { CreativeSystemsPage } from "@/concepts/round2/CreativeSystemsPage";
import { FutureStudioPage } from "@/concepts/round2/FutureStudioPage";
import { FinalDirectionPage } from "@/concepts/final/FinalDirectionPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Alool Technologies website concepts — outside ADI chrome */}
        <Route path="concepts" element={<ConceptsIndexPage />} />
        <Route
          path="concepts/technology-authority"
          element={<TechnologyAuthorityPage />}
        />
        <Route
          path="concepts/creative-technology"
          element={<CreativeTechnologyPage />}
        />
        <Route path="concepts/ai-first" element={<AiFirstPage />} />
        <Route path="concepts/human-centered" element={<HumanCenteredPage />} />
        <Route path="concepts/africa-global" element={<AfricaGlobalPage />} />

        <Route path="concepts/round-2" element={<Round2IndexPage />} />
        <Route
          path="concepts/round-2/ai-editorial"
          element={<AiEditorialPage />}
        />
        <Route
          path="concepts/round-2/creative-systems"
          element={<CreativeSystemsPage />}
        />
        <Route
          path="concepts/round-2/future-studio"
          element={<FutureStudioPage />}
        />
        <Route path="concepts/final" element={<FinalDirectionPage />} />

        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="references" element={<LibraryPage />} />
          <Route path="references/new" element={<ReferenceFormPage />} />
          <Route
            path="references/quick-import"
            element={<QuickUrlImportPage />}
          />
          <Route path="references/:id" element={<ReferenceDetailPage />} />
          <Route path="references/:id/edit" element={<ReferenceFormPage />} />
          <Route path="collections" element={<CollectionsPage />} />
          <Route path="collections/:id" element={<CollectionDetailPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="projects/:id" element={<ProjectDetailPage />} />
          <Route path="import" element={<ImportPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
      <Toaster richColors position="top-right" />
    </BrowserRouter>
  );
}
