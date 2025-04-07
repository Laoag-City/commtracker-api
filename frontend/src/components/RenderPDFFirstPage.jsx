// File: src/components/RenderPDFFirstPage.jsx
import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import * as pdfjsLib from "pdfjs-dist";

// Configure PDF.js worker
// I can't make this work in vite
// hack is to get the version from package.json and use the CDN
/* pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.entry",
  import.meta.url
).toString(); */

pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs";

const RenderPdfFirstPage = ({ base64Pdf }) => {
  const [imgSrc, setImgSrc] = useState(null);

  useEffect(() => {
    const renderFirstPageAsImage = async () => {
      try {
        // Decode base64 to binary
        const binaryPdf = Uint8Array.from(atob(base64Pdf), (char) => char.charCodeAt(0));

        // Load the PDF
        const pdf = await pdfjsLib.getDocument({ data: binaryPdf }).promise;

        // Get the first page
        const page = await pdf.getPage(1);

        // Create a canvas to render the page
        const viewport = page.getViewport({ scale: 1.0 }); // Adjust scale as needed
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        // Render the page
        await page.render(renderContext).promise;

        // Convert canvas to a data URL
        setImgSrc(canvas.toDataURL("image/png"));
      } catch (error) {
        console.error("Error rendering PDF page:", error);
      }
    };

    if (base64Pdf) renderFirstPageAsImage();
  }, [base64Pdf]);

  return imgSrc ? (
    <img src={imgSrc} alt="First page of PDF" style={{ maxWidth: "100%", height: "auto" }} />
  ) : (
    <p>Loading PDF...</p>
  );
};

// PropTypes validation
RenderPdfFirstPage.propTypes = {
  base64Pdf: PropTypes.string.isRequired,
};

export default RenderPdfFirstPage;
