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
        // Process the content to include text between links
        const manuscriptContent = await this.processContentIncludingText(content);

        if (manuscriptContent.trim().length === 0) {
            new Notice("No content could be extracted.");
            return;
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `linked_manuscript_${timestamp}.md`;

        await this.app.vault.create(filename, manuscriptContent);
        new Notice("Linked manuscript created successfully.");
    }

    async processContentIncludingText(content: string): Promise<string> {
        const linkRegex = /\[\[([^\]]+)\]\]/g;
        let lastIdx = 0;
        let manuscriptContent = '';
        
        let match;
        while ((match = linkRegex.exec(content)) !== null) {
            // Add the text before the link
            manuscriptContent += content.substring(lastIdx, match.index);

            // Resolve the link to content and add it
            const file = this.app.metadataCache.getFirstLinkpathDest(match[1], "");
            if (file instanceof TFile) {
                const linkedContent = await this.app.vault.read(file);
                manuscriptContent += linkedContent;
            }

            lastIdx = match.index + match[0].length;
        }
        
        // Add any remaining content after the last link
        manuscriptContent += content.substring(lastIdx);

        return manuscriptContent;
    }
}
