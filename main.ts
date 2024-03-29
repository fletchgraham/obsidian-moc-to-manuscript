import { Notice, Plugin } from "obsidian";

export default class MocToManuscriptPlugin extends Plugin {
  async onload() {
    this.addRibbonIcon("edit", "Generate manuscript", async () => {
      await this.generateManuscript();
      new Notice("Manuscript generated successfully.");
    });
  }

  async generateManuscript(): Promise<void> {
    const { vault } = this.app;

    // Get all markdown files and read their contents asynchronously
    const fileContents: string[] = await Promise.all(
      vault.getMarkdownFiles().map((file) => vault.cachedRead(file))
    );

    // Join the contents of all files into a single string
    const manuscriptContent = fileContents.join("\n\n");

    // Create a manuscript file with the combined contents of all markdown files
    // Make sure to await the promise!
    await this.app.vault.create('manuscript.md', manuscriptContent);

    // Log or notify the user upon successful creation
    console.log("Manuscript created successfully.");
  }
}
