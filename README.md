# Compliance Desk

An independent, self-contained practice website for Indian company secretaries. Extract the complete folder and open **index.html** in a current desktop browser, or serve this folder from any static web host. All runtime assets are bundled.

## GitHub Pages

The ZIP includes an independent Git repository with its own first commit. On Windows, extract the entire ZIP before opening it.

1. In GitHub Desktop, choose **File → Add local repository** and select the extracted **Compliance-Desk** folder containing **index.html**.
2. Choose **Publish repository**. Use **Compliance-Desk** as the name and select public visibility for public GitHub Pages hosting.
3. In that new repository, open **Settings → Pages**. Choose **Deploy from a branch**, **main**, **/(root)**, then **Save**. GitHub displays the website address when publication completes.

For an already-created, empty remote repository, you can also run these commands inside the extracted folder:

    git remote add origin https://github.com/rkhanr786rk-cyber/Compliance-Desk.git
    git push -u origin main

## Working with the desk

The site opens the Companies Act, rules and listing provisions in one reader. Use the procedure library to create a matter and tick its checks, or use the document studio to prepare local Word downloads. Bookmarks and checklist progress are saved by the browser. Document field entries last for the current tab. The Missing materials page explains what to collect to extend the collection. Signed e-filings are submitted separately in the authorised filing system.

The Act text is the 1 April 2021 edition. LODR text is the 15 October 2026 edition. Rule editions vary by instrument. A legal edition has to be updated when subsequent changes apply.

## Files

- **index.html** and **desk/app.js** provide the shared interface and navigation.
- **desk/library**, **desk/pages** and **desk/procedures** hold the reader, schedule pages and practice checklists.
- **desk/forms.js** and **desk/drafts** implement drafting, Word exports and local precedent downloads.
- **desk/tools.js** and **desk/tool-data** hold the workbooks, calendar, date calculator, filing index, duty estimates, case law and subject index.
- **desk/fonts** includes the local font files and their licensing information.
