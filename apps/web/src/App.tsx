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

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
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
