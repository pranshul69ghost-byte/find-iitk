module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: { extend: {} },
  plugins: [],
  corePlugins: { preflight: false } // important: don't reset our base styles
};