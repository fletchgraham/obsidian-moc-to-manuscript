import { Notice, Plugin, TFile } from "obsidian";

export default class MocToManuscriptPlugin extends Plugin {
    async onload() {
        this.addRibbonIcon("edit", "Generate manuscript", async () => {
            await this.generateManuscriptFromLinks();
            new Notice("Manuscript generated successfully.");
        });
    }

    async generateManuscriptFromLinks(): Promise<void> {
        const activeFile = this.app.workspace.getActiveFile();
        if (!activeFile) {
            new Notice("No file is currently open.");
            return;
        }

        const content = await this.app.vault.read(activeFile);
        const links = this.extractWikiStyleLinks(content);
        const fileContents = await this.readLinkedFilesContents(links);

        if(fileContents.length === 0) {
            new Notice("No linked contents could be extracted.");
            return;
        }

        const manuscriptContent = fileContents.join("\n\n");
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `linked_manuscript_${timestamp}.md`;

        await this.app.vault.create(filename, manuscriptContent);
        new Notice("Linked manuscript created successfully.");
    }

    extractWikiStyleLinks(content: string): string[] {
        const links = [];
        const linkRegex = /\[\[([^\]]+)\]\]/g;
        let match;
        while ((match = linkRegex.exec(content)) !== null) {
            links.push(match[1].trim());
        }
        return links;
    }

    async readLinkedFilesContents(links: string[]): Promise<string[]> {
        const fileContents: string[] = [];
        for (const link of links) {
            const file = this.app.metadataCache.getFirstLinkpathDest(link, "");
            if (file instanceof TFile) {
                const content = await this.app.vault.read(file);
                fileContents.push(content);
            }
        }
        return fileContents;
    }
}
