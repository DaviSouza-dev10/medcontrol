import fs from "node:fs/promises";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const outputDir = "C:/Users/davi/OneDrive/Documents/medcontrol/outputs/tabuada-10-a-100";
await fs.mkdir(outputDir, { recursive: true });

const workbook = Workbook.create();
const sheet = workbook.worksheets.add("Tabuada");
sheet.showGridLines = false;

sheet.getRange("A1:K1").merge();
sheet.getRange("A1").values = [["Tabuada de Multiplicacao - 10 a 100"]];
sheet.getRange("A1:K1").format = {
  fill: "#0F766E",
  font: { bold: true, color: "#FFFFFF", size: 16 },
  horizontalAlignment: "center",
  verticalAlignment: "center",
};
sheet.getRange("A1:K1").format.rowHeight = 28;

const headers = ["Numero", ...Array.from({ length: 10 }, (_, i) => `x ${i + 1}`)];
sheet.getRange("A3:K3").values = [headers];
sheet.getRange("A3:K3").format = {
  fill: "#115E59",
  font: { bold: true, color: "#FFFFFF" },
  horizontalAlignment: "center",
  verticalAlignment: "center",
  borders: { preset: "outside", style: "thin", color: "#0B4F4A" },
};

const numbers = Array.from({ length: 91 }, (_, i) => [i + 10]);
sheet.getRange("A4:A94").values = numbers;
sheet.getRange("B4").formulasR1C1 = [["=RC1*R3C"]];
sheet.getRange("B4:K94").fillDown();
sheet.getRange("B4:K94").fillRight();

sheet.getRange("A4:K94").format = {
  horizontalAlignment: "center",
  verticalAlignment: "center",
  borders: { preset: "inside", style: "thin", color: "#D1D5DB" },
};
sheet.getRange("A4:A94").format = {
  fill: "#CCFBF1",
  font: { bold: true, color: "#134E4A" },
  horizontalAlignment: "center",
  borders: { preset: "inside", style: "thin", color: "#99F6E4" },
};
sheet.getRange("A3:K94").format.borders = { preset: "outside", style: "medium", color: "#0F766E" };
sheet.getRange("A:K").format.columnWidth = 12;
sheet.getRange("A:A").format.columnWidth = 14;
sheet.getRange("A3:K94").format.rowHeight = 20;
sheet.freezePanes.freezeRows(3);
sheet.freezePanes.freezeColumns(1);

const check = await workbook.inspect({
  kind: "table",
  range: "Tabuada!A3:K8",
  include: "values,formulas",
  tableMaxRows: 6,
  tableMaxCols: 11,
});
console.log(check.ndjson);

const errors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 20 },
  summary: "formula error scan",
});
console.log(errors.ndjson);

const preview = await workbook.render({ sheetName: "Tabuada", range: "A1:K18", scale: 1.5, format: "png" });
await fs.writeFile(`${outputDir}/preview.png`, new Uint8Array(await preview.arrayBuffer()));

const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(`${outputDir}/tabuada_10_a_100.xlsx`);
