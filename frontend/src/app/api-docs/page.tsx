import { SwaggerUIClient } from "./swagger-ui-client";

export const metadata = {
  title: "API Docs | Sistem Inventory",
  description: "Dokumentasi REST API Sistem Manajemen Inventory Apotek",
};

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="border-b px-6 py-4">
        <h1 className="text-xl font-semibold text-gray-900">API Documentation</h1>
        <p className="text-sm text-gray-500 mt-0.5">Sistem Manajemen Inventory Apotek — REST API Reference</p>
      </div>
      <SwaggerUIClient />
    </div>
  );
}
