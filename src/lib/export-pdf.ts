"use client";

import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface ExportOptions {
  userName: string;
  teamName: string;
}

/**
 * 导出画像页面为 PDF
 * 将传入的 DOM 元素列表逐一渲染到 PDF 中
 */
export async function exportProfileToPDF(
  sections: HTMLElement[],
  options: ExportOptions
): Promise<void> {
  const { userName, teamName } = options;
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const contentWidth = pageWidth - margin * 2;

  // 封面
  pdf.setFontSize(24);
  pdf.text("Foxity 能力画像报告", pageWidth / 2, 60, { align: "center" });
  pdf.setFontSize(14);
  pdf.text(userName, pageWidth / 2, 80, { align: "center" });
  pdf.setFontSize(11);
  pdf.text(teamName, pageWidth / 2, 92, { align: "center" });
  pdf.setFontSize(9);
  pdf.text(
    `生成时间：${new Date().toLocaleDateString("zh-CN")}`,
    pageWidth / 2,
    105,
    { align: "center" }
  );
  pdf.setDrawColor(242, 170, 114);
  pdf.setLineWidth(0.5);
  pdf.line(margin, 115, pageWidth - margin, 115);

  let currentY = 130;

  for (const section of sections) {
    const canvas = await html2canvas(section, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
    });

    const imgData = canvas.toDataURL("image/png");
    const imgWidth = contentWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // 如果剩余空间不够，换页
    if (currentY + imgHeight > pageHeight - margin) {
      pdf.addPage();
      currentY = margin;
    }

    // 如果图片高度超过一页，分页处理
    if (imgHeight > pageHeight - margin * 2) {
      // 截断为多页
      const ratio = (pageHeight - margin * 2) / imgHeight;
      const sectionCanvasHeight = canvas.height * ratio;
      let remainingHeight = imgHeight;
      let srcY = 0;

      while (remainingHeight > 0) {
        const pageImgHeight = Math.min(remainingHeight, pageHeight - margin * 2);

        // 创建临时 canvas 截取当前部分
        const tmpCanvas = document.createElement("canvas");
        tmpCanvas.width = canvas.width;
        tmpCanvas.height = Math.min(
          canvas.height - srcY,
          canvas.height * (pageImgHeight / imgHeight)
        );
        const tmpCtx = tmpCanvas.getContext("2d");
        if (tmpCtx) {
          tmpCtx.drawImage(
            canvas,
            0,
            srcY,
            canvas.width,
            tmpCanvas.height,
            0,
            0,
            canvas.width,
            tmpCanvas.height
          );
          const tmpImgData = tmpCanvas.toDataURL("image/png");
          pdf.addImage(tmpImgData, "PNG", margin, margin, imgWidth, pageImgHeight);
        }

        srcY += tmpCanvas.height;
        remainingHeight -= pageImgHeight;

        if (remainingHeight > 0) {
          pdf.addPage();
        }
      }
      currentY = pageHeight;
    } else {
      pdf.addImage(imgData, "PNG", margin, currentY, imgWidth, imgHeight);
      currentY += imgHeight + 5;
    }
  }

  // 页脚
  const pageCount = pdf.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.text(
      `Foxity · 第 ${i} / ${pageCount} 页`,
      pageWidth / 2,
      pageHeight - 5,
      { align: "center" }
    );
  }

  const fileName = `${userName}_Foxity画像报告.pdf`;
  pdf.save(fileName);
}
