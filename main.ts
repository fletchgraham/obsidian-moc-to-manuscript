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
        const manuscriptContent = await this.processContentIncludingText(content);

        if (manuscriptContent.trim().length === 0) {
            new Notice("No content could be extracted.");
            return;
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `manuscript_${timestamp}.md`;

        await this.app.vault.create(filename, manuscriptContent.trim());
        new Notice("Manuscript created successfully.");
    }

    async processContentIncludingText(content: string): Promise<string> {
        const linkRegex = /\[\[([^\]]+)\]\]/g;
        let lastIdx = 0;
        let manuscriptContent = '';
        
        let match;
        while ((match = linkRegex.exec(content)) !== null) {
            // Add the text before the link, ensuring it ends with exactly one newline
            manuscriptContent += this.ensureSingleNewline(content.substring(lastIdx, match.index));

            // Resolve the link to content and add it
            const file = this.app.metadataCache.getFirstLinkpathDest(match[1], "");
            if (file instanceof TFile) {
                let linkedContent = await this.app.vault.read(file);
                linkedContent = this.removeFrontMatter(linkedContent);
                linkedContent = this.removeLinkOnlyLines(linkedContent);
                // Append linked content, ensuring it ends with exactly one newline
                manuscriptContent += this.ensureSingleNewline(linkedContent);
            }

            lastIdx = match.index + match[0].length;
        }
        
        // Add any remaining content after the last link, ensuring it ends with exactly one newline
        manuscriptContent += this.ensureSingleNewline(content.substring(lastIdx));

        return manuscriptContent;
    }

    removeFrontMatter(content: string): string {
        const frontMatterRegex = /^---[\s\S]+?---\n/;
        return content.replace(frontMatterRegex, '');
    }

    removeLinkOnlyLines(content: string): string {
        // Remove lines that contain only a wiki-style link
        return content.replace(/^\[\[([^\]]+)\]\]\n/gm, '');
    }

    ensureSingleNewline(content: string): string {
        // Trim whitespace and ensure the content ends with exactly one newline
        return content.trim() + "\n";
    }
}
