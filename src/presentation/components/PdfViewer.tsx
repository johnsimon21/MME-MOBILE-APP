import React, { useEffect, useState } from "react";
import { View, Image, Text } from "react-native";
import { PDFDocument } from "pdf-lib";
import { renderAsync } from "docx-preview";

interface FileThumbnailProps {
  fileUri: string;
  fileType: "pdf" | "docx";
}

const FileThumbnail: React.FC<FileThumbnailProps> = ({ fileUri, fileType }) => {
  const [thumbnail, setThumbnail] = useState<string | null>(null);

  useEffect(() => {
    const generateThumbnail = async () => {
      try {
        if (fileType === "pdf") {
          const response = await fetch(fileUri);
          const arrayBuffer = await response.arrayBuffer();
          const pdfDoc = await PDFDocument.load(arrayBuffer);
          const firstPage = pdfDoc.getPages()[0];
          
          // Create a new PDF document for the thumbnail
          const thumbnailDoc = await PDFDocument.create();
          const [embeddedPage] = await thumbnailDoc.embedPdf(pdfDoc, [0]);
          const thumbnailPage = thumbnailDoc.addPage();
          
          thumbnailPage.drawPage(embeddedPage, {
            x: 0,
            y: 0,
            width: thumbnailPage.getWidth(),
            height: thumbnailPage.getHeight(),
          });
          
          const thumbnailBytes = await thumbnailDoc.saveAsBase64();
          setThumbnail(`data:application/pdf;base64,${thumbnailBytes}`);
          
        } else if (fileType === "docx") {
          const response = await fetch(fileUri);
          const blob = await response.blob();
          const canvas = document.createElement("canvas");
          await renderAsync(blob, canvas);
          setThumbnail(canvas.toDataURL());
        }
      } catch (error) {
        console.error("Error generating thumbnail:", error);
      }
    };

    generateThumbnail();
  }, [fileUri, fileType]);

  alert(thumbnail)
  return thumbnail
};

export default FileThumbnail;
