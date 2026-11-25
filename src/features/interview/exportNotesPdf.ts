"use client";

export interface ExportNoteItem {
  title: string;
  note: string;
}

/**
 * Dynamically imports jsPDF on demand so the PDF generator is code-split
 * out of initial interview route bundles.
 */
export async function exportNotesPdf(
  documentTitle: string,
  filename: string,
  items: ExportNoteItem[],
): Promise<void> {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF();
  let y = 20;
  doc.setFontSize(22);
  doc.text(documentTitle, 20, y);
  y += 15;

  for (const item of items) {
    if (!item.note) continue;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    const splitTitle = doc.splitTextToSize(item.title, 170);
    doc.text(splitTitle, 20, y);
    y += splitTitle.length * 7 + 2;

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    const splitNote = doc.splitTextToSize(item.note, 160);
    doc.text(splitNote, 25, y);
    y += splitNote.length * 6 + 10;

    if (y > 270) {
      doc.addPage();
      y = 20;
    }
  }

  doc.save(filename);
}
