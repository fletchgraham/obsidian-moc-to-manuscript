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
        let manuscriptContent = await this.processContentIncludingText(content);

        // Final trim and ensure it ends with exactly one newline for the whole manuscript
        manuscriptContent = manuscriptContent.trim() + "\n";

        if (manuscriptContent.length === 1) { // If only the newline remains
            new Notice("No content could be extracted.");
            return;
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `manuscript_${timestamp}.md`;

        await this.app.vault.create(filename, manuscriptContent);
        new Notice("Manuscript created successfully.");
    }

    async processContentIncludingText(content: string): Promise<string> {
        const linkRegex = /\[\[([^\]]+)\]\]/g;
        let lastIdx = 0;
        let manuscriptContent = '';
        
        let match;
        while ((match = linkRegex.exec(content)) !== null) {
            // Add the text before the link with a single newline, if there's text
            const textBeforeLink = content.substring(lastIdx, match.index).trim();
            if (textBeforeLink) {
                manuscriptContent += textBeforeLink + "\n\n";
            }

            const file = this.app.metadataCache.getFirstLinkpathDest(match[1], "");
            if (file instanceof TFile) {
                let linkedContent = await this.app.vault.read(file);
                linkedContent = this.removeFrontMatter(linkedContent);
                linkedContent = this.removeLinkOnlyLines(linkedContent).trim();
                // Append linked content with exactly one newline at the end
                if (linkedContent) {
                    manuscriptContent += linkedContent + "\n\n";
                }
            }

            lastIdx = match.index + match[0].length;
        }
        
        // Add any remaining content after the last link, ensuring it ends with exactly one newline
        const remainingContent = content.substring(lastIdx).trim();
        if (remainingContent) {
            manuscriptContent += remainingContent + "\n";
        }

        // Ensure there's not more than one blank line between sections
        return manuscriptContent.replace(/\n{3,}/g, "\n\n");
    }

    removeFrontMatter(content: string): string {
        const frontMatterRegex = /^---[\s\S]+?---\n/;
        return content.replace(frontMatterRegex, '');
    }

    removeLinkOnlyLines(content: string): string {
        // Remove lines that contain only a wiki-style link
        return content.replace(/^\[\[([^\]]+)\]\]$/gm, '');
    }
}
