import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
plugins: [react()],
base: "/find-iitk/" // replace with "/<your-repo>/" or "/" for user pages
});