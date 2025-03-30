document.addEventListener('DOMContentLoaded', function() {
    // Load QRious library instead of QRCode
    const qrScript = document.createElement('script');
    qrScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrious/4.0.2/qrious.min.js';
    document.head.appendChild(qrScript);

    // Define initial data that will only be used if nothing exists in localStorage
    let initialFoldersData = [
        { 
            id: "folder1", 
            name: "CNC Machine TX-500", 
            description: "500W industrial CNC router with 5-axis movement",
            count: 4,
            date: "2023-10-15"
        },
        { 
            id: "folder2", 
            name: "Hydraulic Press HP-2000", 
            description: "2000-ton hydraulic press for heavy-duty metal forming",
            count: 7,
            date: "2023-09-22"
        },
        { 
            id: "folder3", 
            name: "Conveyor System C-100", 
            description: "100m modular conveyor system with speed control",
            count: 3,
            date: "2023-11-05"
        }
    ];

    let initialDocumentsData = {
        "folder1": [
            {
                id: "doc1",
                title: "Installation Guide",
                version: "v2.1",
                type: "pdf",
                size: "4.2 MB",
                date: "2023-06-10"
            },
            {
                id: "doc2",
                title: "Operation Manual",
                version: "v1.5",
                type: "pdf",
                size: "8.7 MB",
                date: "2023-08-22"
            },
            {
                id: "doc3",
                title: "Maintenance Schedule",
                version: "v1.2",
                type: "xlsx",
                size: "1.8 MB",
                date: "2023-07-15"
            },
            {
                id: "doc4",
                title: "Wiring Diagram",
                version: "v3.0",
                type: "jpg",
                size: "2.5 MB",
                date: "2023-09-30"
            }
        ],
        "folder2": [
            {
                id: "doc5",
                title: "Assembly Instructions",
                version: "v1.0",
                type: "pdf",
                size: "5.4 MB",
                date: "2023-05-12"
            },
            {
                id: "doc6",
                title: "Safety Guidelines",
                version: "v2.3",
                type: "pdf",
                size: "3.1 MB",
                date: "2023-08-05"
            }
        ],
        "folder3": [
            {
                id: "doc7",
                title: "Component List",
                version: "v1.1",
                type: "pdf",
                size: "2.3 MB",
                date: "2023-07-28"
            },
            {
                id: "doc8",
                title: "Troubleshooting Guide",
                version: "v1.4",
                type: "pdf",
                size: "4.8 MB",
                date: "2023-10-17"
            },
            {
                id: "doc9",
                title: "Technical Specifications",
                version: "v2.0",
                type: "pdf",
                size: "3.6 MB",
                date: "2023-09-05"
            }
        ]
    };

    // Persistence functions
    function saveToLocalStorage() {
        localStorage.setItem('techDocsData', JSON.stringify({
            folders: foldersData,
            documents: documentsData
        }));
    }

    function loadFromLocalStorage() {
        const savedData = localStorage.getItem('techDocsData');
        if (savedData) {
            const parsedData = JSON.parse(savedData);
            foldersData = parsedData.folders;
            documentsData = parsedData.documents;
        } else {
            // If no data in localStorage, use the initial sample data
            foldersData = initialFoldersData;
            documentsData = initialDocumentsData;
            // Save this initial data to localStorage
            saveToLocalStorage();
        }
    }

    // Declare variables we'll use
    let foldersData = [];
    let documentsData = {};
    
    // Load data before initializing the UI
    loadFromLocalStorage();

    // DOM elements
    const foldersContainer = document.getElementById('folders-container');
    const documentsContainer = document.getElementById('documents-container');
    const emptyState = document.getElementById('empty-state');
    const breadcrumbs = document.querySelector('.breadcrumbs');
    const passwordModal = document.getElementById('password-modal');
    const folderModal = document.getElementById('folder-modal');
    const uploadModal = document.getElementById('upload-modal');
    const deleteModal = document.getElementById('delete-modal');
    const searchInput = document.getElementById('search-input');
    
    // Current navigation state
    let currentFolderId = null;
    let navigationHistory = [];
    let itemToDelete = null; // Will store the item ID and type for deletion

    // Add these new DOM elements
    const renameModal = document.getElementById('rename-modal');
    const qrModal = document.getElementById('qr-modal');
    
    // Item to be renamed
    let itemToRename = null;

    // Initialize the UI
    renderHome();

    // Event Listeners
    document.getElementById('home-btn').addEventListener('click', navigateToHome);
    document.getElementById('create-folder-btn').addEventListener('click', showPasswordModalForCreateFolder);
    document.getElementById('upload-btn').addEventListener('click', showPasswordModalForUpload);
    document.getElementById('empty-create-btn').addEventListener('click', showPasswordModalForCreateFolder);
    
    document.getElementById('password-submit').addEventListener('click', checkPassword);
    document.getElementById('create-folder-submit').addEventListener('click', createFolder);
    document.getElementById('upload-submit').addEventListener('click', uploadFile);
    document.getElementById('delete-confirm').addEventListener('click', confirmDelete);
    
    // Close modal buttons
    document.querySelectorAll('.close-modal, .cancel-btn').forEach(button => {
        button.addEventListener('click', closeAllModals);
    });

    // Toggle password visibility
    document.querySelectorAll('.toggle-password').forEach(toggle => {
        toggle.addEventListener('click', function() {
            const passwordInput = this.previousElementSibling;
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            this.classList.toggle('fa-eye');
            this.classList.toggle('fa-eye-slash');
        });
    });

    // File drop area
    const fileDropArea = document.querySelector('.file-drop-area');
    const fileInput = document.querySelector('.file-input');
    const filePreview = document.querySelector('.file-preview');

    fileDropArea.addEventListener('click', () => fileInput.click());
    
    fileInput.addEventListener('change', handleFileSelect);
    
    fileDropArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        fileDropArea.classList.add('active');
    });
    
    fileDropArea.addEventListener('dragleave', () => {
        fileDropArea.classList.remove('active');
    });
    
    fileDropArea.addEventListener('drop', (e) => {
        e.preventDefault();
        fileDropArea.classList.remove('active');
        
        if (e.dataTransfer.files.length) {
            fileInput.files = e.dataTransfer.files;
            handleFileSelect();
        }
    });

    // Search functionality
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase().trim();
        
        if (currentFolderId) {
            // Search within current folder
            const filteredDocs = documentsData[currentFolderId].filter(doc => 
                doc.title.toLowerCase().includes(searchTerm) || 
                doc.version.toLowerCase().includes(searchTerm)
            );
            renderDocuments(filteredDocs);
        } else {
            // Search folders
            const filteredFolders = foldersData.filter(folder => 
                folder.name.toLowerCase().includes(searchTerm) || 
                folder.description.toLowerCase().includes(searchTerm)
            );
            renderFolders(filteredFolders);
        }
    });

    // Add this to your event listeners section
    document.getElementById('rename-confirm').addEventListener('click', confirmRename);
    document.getElementById('download-qr').addEventListener('click', downloadQRCode);
    
    // Update file drop area events for multiple files
    document.querySelector('.browse-btn').addEventListener('click', () => fileInput.click());

    // Functions
    function renderHome() {
        currentFolderId = null;
        updateBreadcrumbs();
        
        if (foldersData.length === 0) {
            showEmptyState();
        } else {
            hideEmptyState();
            renderFolders(foldersData);
            clearDocuments();
        }
        
        // Update navigation buttons
        document.getElementById('home-btn').classList.add('active');
        document.getElementById('upload-btn').classList.remove('active');
    }

    function renderFolders(folders) {
        foldersContainer.innerHTML = '';
        
        folders.forEach(folder => {
            const folderElement = document.createElement('div');
            folderElement.className = 'folder';
            folderElement.dataset.id = folder.id;
            
            folderElement.innerHTML = `
                <svg class="folder-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22 19C22 19.5304 21.7893 20.0391 21.4142 20.4142C21.0391 20.7893 20.5304 21 20 21H4C3.46957 21 2.96086 20.7893 2.58579 20.4142C2.21071 20.0391 2 19.5304 2 19V5C2 4.46957 2.21071 3.96086 2.58579 3.58579C2.96086 3.21071 3.46957 3 4 3H9L11 6H20C20.5304 6 21.0391 6.21071 21.4142 6.58579C21.7893 6.96086 22 7.46957 22 8V19Z" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <div class="folder-actions">
                    <button class="rename-folder-btn" title="Rename folder" data-id="${folder.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="qr-folder-btn" title="Generate QR code" data-id="${folder.id}">
                        <i class="fas fa-qrcode"></i>
                    </button>
                <button class="delete-folder-btn" title="Delete folder" data-id="${folder.id}">
                    <i class="fas fa-trash-alt"></i>
                </button>
                </div>
                <h3>${folder.name}</h3>
                <p>${folder.description}</p>
                <div class="folder-meta">
                    <span>${folder.count} documents</span>
                    <span>Updated ${formatDate(folder.date)}</span>
                </div>
            `;
            
            folderElement.addEventListener('click', (e) => {
                // Don't open folder if clicking on action buttons
                if (!e.target.closest('.folder-actions button')) {
                    openFolder(folder.id);
                }
            });

            // Add event listeners for the action buttons
            const deleteBtn = folderElement.querySelector('.delete-folder-btn');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent folder opening
                showDeleteConfirmation('folder', folder.id, folder.name);
            });
            
            const renameBtn = folderElement.querySelector('.rename-folder-btn');
            renameBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent folder opening
                showRenameModal('folder', folder.id, folder.name);
            });
            
            const qrBtn = folderElement.querySelector('.qr-folder-btn');
            qrBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent folder opening
                showQRCode(folder.id, folder.name);
            });
            
            foldersContainer.appendChild(folderElement);
        });
    }

    function renderDocuments(documents) {
        documentsContainer.innerHTML = '';
        
        documents.forEach(doc => {
            const docElement = document.createElement('div');
            docElement.className = 'document';
            
            const iconType = getDocumentIcon(doc.type);
            
            docElement.innerHTML = `
                <div class="document-preview">
                    <svg class="document-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        ${iconType}
                    </svg>
                </div>
                <h4>${doc.title}</h4>
                <div class="document-meta">
                    <div>${doc.version} • ${doc.type.toUpperCase()} • ${doc.size}</div>
                    <div>Updated ${formatDate(doc.date)}</div>
                </div>
                <div class="document-actions">
                    <button title="Rename" class="rename-document-btn" data-id="${doc.id}"><i class="fas fa-edit"></i></button>
                    <button title="Download"><i class="fas fa-download"></i></button>
                    
                    <button title="Delete" class="delete-document-btn" data-id="${doc.id}"><i class="fas fa-trash-alt"></i></button>
                </div>
            `;
            
            docElement.querySelector('.document-preview').addEventListener('click', () => viewDocument(doc.id));
            
            // Add event listeners
            const deleteBtn = docElement.querySelector('.delete-document-btn');
            deleteBtn.addEventListener('click', () => {
                showDeleteConfirmation('document', doc.id, doc.title);
            });
            
            const renameBtn = docElement.querySelector('.rename-document-btn');
            renameBtn.addEventListener('click', () => {
                showRenameModal('document', doc.id, doc.title);
            });
            
            const downloadBtn = docElement.querySelector('button[title="Download"]');
            downloadBtn.addEventListener('click', () => {
                downloadDocument(doc.id, doc.title, doc.type);
            });
            
            
            documentsContainer.appendChild(docElement);
        });
    }

    function getDocumentIcon(type) {
        switch(type.toLowerCase()) {
            case 'pdf':
                return `<path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M14 2V8H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M9 13H15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M9 17H12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
            case 'doc':
            case 'docx':
                return `<path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M14 2V8H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M16 13H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M16 17H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M10 9H9H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
            case 'xls':
            case 'xlsx':
                return `<path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M14 2V8H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M8 13H16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M8 17H16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <rect x="8" y="9" width="8" height="10" rx="1" stroke="currentColor" stroke-width="2"/>`;
            case 'jpg':
            case 'jpeg':
            case 'png':
                return `<rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/>
                <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
                <path d="M21 15L16 10L5 21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
            default:
                return `<path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M14 2V8H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
        }
    }

    function openFolder(folderId) {
        currentFolderId = folderId;
        const folder = foldersData.find(f => f.id === folderId);
        
        // Add to navigation history
        navigationHistory.push({
            id: folderId,
            name: folder.name
        });
        
        updateBreadcrumbs();
        
        // Render folder contents
        clearFolders();
        
        if (documentsData[folderId] && documentsData[folderId].length > 0) {
            hideEmptyState();
            renderDocuments(documentsData[folderId]);
        } else {
            showEmptyState('This folder is empty', 'Upload manuals to this folder');
        }
    }

    function viewDocument(docId) {
        if (!currentFolderId) return;
        
        // Find the document in the current folder
        const doc = documentsData[currentFolderId].find(d => d.id === docId);
        if (!doc) return;
        
        // Check if this document has a stored file (for documents uploaded by user)
        const hasStoredFile = doc.fileData ? true : false;
        
        // Create document viewer modal
        const viewerModal = document.createElement('div');
        viewerModal.className = 'modal document-viewer-modal';
        viewerModal.style.display = 'flex';
        
        // Prepare modal header and footer content
        const headerContent = `
            <h2>${doc.title} <span class="doc-version">${doc.version}</span></h2>
            <div class="viewer-actions">
                <button title="Download" class="download-doc-btn"><i class="fas fa-download"></i></button>
                <button title="Close" class="close-modal"><i class="fas fa-times"></i></button>
            </div>
        `;
        
        const footerContent = `
            <div class="document-info">
                <span><i class="fas fa-file"></i> ${doc.type.toUpperCase()}</span>
                <span><i class="fas fa-hdd"></i> ${doc.size}</span>
                <span><i class="fas fa-calendar"></i> Last updated ${formatDate(doc.date)}</span>
            </div>
        `;
        
        // Generate different content based on file type and availability
        let previewContent;
        
        if (hasStoredFile) {
            // Handle different file types for real preview
            switch(doc.type.toLowerCase()) {
                case 'pdf':
                    previewContent = `
                        <div class="pdf-preview">
                            <iframe src="${doc.fileData}" width="100%" height="100%" style="border: none;"></iframe>
                        </div>
                    `;
                    break;
                    
                case 'jpg':
                case 'jpeg':
                case 'png':
                case 'gif':
                    previewContent = `
                        <div class="image-preview">
                            <div class="image-content">
                                <img src="${doc.fileData}" alt="${doc.title}" style="max-width: 100%; max-height: 70vh;">
                            </div>
                        </div>
                    `;
                    break;
                    
                case 'txt':
                case 'csv':
                    // For text files, we can display the content directly
                    previewContent = `
                        <div class="text-preview">
                            <pre>${doc.textContent || 'Text content not available'}</pre>
                        </div>
                    `;
                    break;
                    
                case 'doc':
                case 'docx':
                case 'xls':
                case 'xlsx':
                case 'ppt':
                case 'pptx':
                    // Microsoft Office files - use Google Docs Viewer as fallback
                    previewContent = `
                        <div class="office-preview">
                            <p class="preview-message">Using Google Docs Viewer for preview:</p>
                            <iframe src="https://docs.google.com/viewer?embedded=true&url=${encodeURIComponent(doc.fileData)}" 
                                    width="100%" height="500px" frameborder="0"></iframe>
                        </div>
                    `;
                    break;
                    
                default:
                    // For unsupported file types
                    previewContent = `
                        <div class="unsupported-preview">
                            <div class="unsupported-content">
                                <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: var(--warning-color);"></i>
                                <h3>Preview not available</h3>
                                <p>This file type (${doc.type}) cannot be previewed in the browser.</p>
                                <p>Please download the file to view its contents.</p>
                                <button class="download-btn submit-btn" style="margin-top: 20px;">
                                    <i class="fas fa-download"></i> Download File
                                </button>
                            </div>
                        </div>
                    `;
            }
        } else {
            // Sample/demo documents without actual files
            previewContent = `
                <div class="demo-preview">
                    <div class="demo-content">
                        <i class="fas fa-file-alt" style="font-size: 48px; color: var(--gray-400);"></i>
                        <h3>Demo Document</h3>
                        <p>This is a sample document without actual file content.</p>
                        <p>In a production environment, this would display the real file.</p>
                        <p>Document: ${doc.title} (${doc.type.toUpperCase()})</p>
                    </div>
                </div>
            `;
        }
        
        // Assemble the modal content
        viewerModal.innerHTML = `
            <div class="modal-content document-viewer">
                <div class="modal-header">${headerContent}</div>
                <div class="modal-body document-preview-container">${previewContent}</div>
                <div class="modal-footer">${footerContent}</div>
            </div>
        `;
        
        // Add to the DOM
        document.body.appendChild(viewerModal);
        
        // Add event listeners
        viewerModal.querySelector('.close-modal').addEventListener('click', () => {
            document.body.removeChild(viewerModal);
        });
        
        viewerModal.querySelector('.download-doc-btn').addEventListener('click', () => {
            downloadDocument(doc.id, doc.title, doc.type);
        });
        
        // Handle additional download button if present
        const downloadBtn = viewerModal.querySelector('.download-btn');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => {
                downloadDocument(doc.id, doc.title, doc.type);
            });
        }
        
        viewerModal.querySelector('.print-doc-btn').addEventListener('click', () => {
            printDocument(doc.id);
        });
        
        // Close when clicking outside the content
        viewerModal.addEventListener('click', (e) => {
            if (e.target === viewerModal) {
                document.body.removeChild(viewerModal);
            }
        });
        
        // Close on ESC key
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                document.body.removeChild(viewerModal);
                document.removeEventListener('keydown', handleEsc);
            }
        };
        document.addEventListener('keydown', handleEsc);
    }

    function printDocument(docId) {
        if (!currentFolderId) return;
        
        // Find the document in the current folder
        const doc = documentsData[currentFolderId].find(d => d.id === docId);
        if (!doc) return;
        
        const hasStoredFile = doc.fileData ? true : false;
        
        if (hasStoredFile) {
            // Different printing approach based on file type
            switch(doc.type.toLowerCase()) {
                case 'pdf':
                    // For PDFs, create a temporary iframe to print from
                    const pdfFrame = document.createElement('iframe');
                    pdfFrame.style.position = 'absolute';
                    pdfFrame.style.left = '-9999px';
                    pdfFrame.src = doc.fileData;
                    
                    document.body.appendChild(pdfFrame);
                    
                    pdfFrame.onload = function() {
                        try {
                            setTimeout(() => {
                                pdfFrame.contentWindow.print();
                                // Remove the iframe after print dialog closes
                                setTimeout(() => {
                                    document.body.removeChild(pdfFrame);
                                }, 100);
                            }, 500);
                        } catch (error) {
                            console.error('Print error:', error);
                            alert('Could not print the PDF. Please try downloading it instead.');
                            document.body.removeChild(pdfFrame);
                        }
                    };
                    break;
                    
                case 'jpg':
                case 'jpeg':
                case 'png':
                case 'gif':
                    // For images, create a printable window with just the image
                    const printWindow = window.open('', '_blank');
                    if (!printWindow) {
                        alert('Please allow popups to print images');
                        return;
                    }
                    
                    printWindow.document.write(`
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <title>Print: ${doc.title}</title>
                            <style>
                                body {
                                    display: flex;
                                    justify-content: center;
                                    align-items: center;
                                    margin: 0;
                                    padding: 20px;
                                }
                                img {
                                    max-width: 100%;
                                    max-height: 100vh;
                                }
                                .info {
                                    position: absolute;
                                    bottom: 10px;
                                    right: 10px;
                                    font-family: Arial, sans-serif;
                                    font-size: 12px;
                                    color: #888;
                                }
                                @media print {
                                    .info {
                                        display: none;
                                    }
                                    body {
                                        padding: 0;
                                    }
                                }
                            </style>
                        </head>
                        <body>
                            <img src="${doc.fileData}" alt="${doc.title}">
                            <div class="info">
                                ${doc.title} (${doc.version}) - Print from TechDocs
                            </div>
                            <script>
                                // Print automatically when loaded
                                window.onload = function() {
                                    setTimeout(function() {
                                        window.print();
                                        setTimeout(function() {
                                            window.close();
                                        }, 100);
                                    }, 500);
                                };
                            </script>
                        </body>
                        </html>
                    `);
                    printWindow.document.close();
                    break;
                    
                case 'txt':
                case 'csv':
                case 'json':
                    // For text files, create a formatted print window
                    const textPrintWindow = window.open('', '_blank');
                    if (!textPrintWindow) {
                        alert('Please allow popups to print text files');
                        return;
                    }
                    
                    // Format the text content for printing
                    let formattedContent = doc.textContent || '';
                    
                    // Escape HTML to prevent script execution
                    formattedContent = formattedContent
                        .replace(/&/g, '&amp;')
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;')
                        .replace(/"/g, '&quot;')
                        .replace(/'/g, '&#039;');
                    
                    // Convert line breaks to <br> tags
                    formattedContent = formattedContent.replace(/\n/g, '<br>');
                    
                    textPrintWindow.document.write(`
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <title>Print: ${doc.title}</title>
                            <style>
                                body {
                                    font-family: Consolas, monospace;
                                    margin: 20px;
                                    white-space: pre-wrap;
                                    line-height: 1.5;
                                }
                                header {
                                    border-bottom: 1px solid #ccc;
                                    margin-bottom: 20px;
                                    padding-bottom: 10px;
                                }
                                .content {
                                    margin-bottom: 30px;
                                }
                                footer {
                                    border-top: 1px solid #ccc;
                                    margin-top: 20px;
                                    padding-top: 10px;
                                    font-size: 11px;
                                    color: #666;
                                }
                                @media print {
                                    body {
                                        margin: 0.5in;
                                    }
                                }
                            </style>
                        </head>
                        <body>
                            <header>
                                <h2>${doc.title} <small>${doc.version}</small></h2>
                            </header>
                            <div class="content">
                                ${formattedContent}
                            </div>
                            <footer>
                                Printed from TechDocs on ${new Date().toLocaleString()}
                            </footer>
                            <script>
                                window.onload = function() {
                                    setTimeout(function() {
                                        window.print();
                                        setTimeout(function() {
                                            window.close();
                                        }, 100);
                                    }, 500);
                                };
                            </script>
                        </body>
                        </html>
                    `);
                    textPrintWindow.document.close();
                    break;
                    
                default:
                    // For other file types, inform the user to download instead
                    alert(`This file type (${doc.type}) cannot be printed directly. Please download the file to print it.`);
                    downloadDocument(doc.id, doc.title, doc.type);
            }
        } else {
            // For demo documents, create a simulated print
            const printWindow = window.open('', '_blank');
            if (!printWindow) {
                alert('Please allow popups to print documents');
                return;
            }
            
            // Generate simulated content based on document type
            let simulatedContent = '';
            
            switch(doc.type.toLowerCase()) {
                case 'pdf':
                    simulatedContent = `
                        <div style="border: 1px solid #ccc; padding: 20px; margin-bottom: 20px;">
                            <h3 style="color: #333;">${doc.title}</h3>
                            <p>This is a sample content for demonstration purposes.</p>
                            <p>In a real application, this would be the actual PDF content.</p>
                            <p>Document ID: ${doc.id}</p>
                            <p>Version: ${doc.version}</p>
                            <p>Type: ${doc.type.toUpperCase()}</p>
                        </div>
                    `;
                    break;
                    
                case 'jpg':
                case 'jpeg':
                case 'png':
                case 'gif':
                    simulatedContent = `
                        <div style="text-align: center; margin-bottom: 20px;">
                            <div style="border: 1px solid #ccc; padding: 20px; display: inline-block;">
                                <div style="width: 300px; height: 200px; background-color: #f0f0f0; display: flex; align-items: center; justify-content: center;">
                                    <span style="color: #666; font-style: italic;">Sample Image Preview</span>
                                </div>
                                <p style="margin-top: 10px;">${doc.title} (${doc.version})</p>
                            </div>
                        </div>
                    `;
                    break;
                    
                default:
                    simulatedContent = `
                        <div style="font-family: monospace; border: 1px solid #ccc; padding: 20px; white-space: pre-wrap; margin-bottom: 20px;">
                            Title: ${doc.title}
                            Version: ${doc.version}
                            Type: ${doc.type.toUpperCase()}
                            Size: ${doc.size}
                            Last Updated: ${formatDate(doc.date)}
                            
                            -----------------------------------------------
                            
                            This is a sample document content for demonstration purposes.
                            In a real application, this would show the actual file content.
                            
                            -----------------------------------------------
                            
                            TechDocs • Industrial Documentation Portal
                        </div>
                    `;
            }
            
            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Print: ${doc.title}</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            margin: 20px;
                        }
                        header {
                            border-bottom: 1px solid #ccc;
                            margin-bottom: 20px;
                            padding-bottom: 10px;
                        }
                        footer {
                            border-top: 1px solid #ccc;
                            margin-top: 20px;
                            padding-top: 10px;
                            font-size: 11px;
                            color: #666;
                        }
                        @media print {
                            .no-print {
                                display: none;
                            }
                        }
                    </style>
                </head>
                <body>
                    <header>
                        <h2>${doc.title} <small>${doc.version}</small></h2>
                        <p class="no-print" style="color: #999; font-style: italic;">Demo document preview - for demonstration purposes only</p>
                    </header>
                    
                    ${simulatedContent}
                    
                    <footer>
                        TechDocs • Printed on ${new Date().toLocaleString()}
                    </footer>
                    
                    <script>
                        window.onload = function() {
                            setTimeout(function() {
                                window.print();
                                setTimeout(function() {
                                    window.close();
                                }, 100);
                            }, 500);
                        };
                    </script>
                </body>
                </html>
            `);
            printWindow.document.close();
        }
    }

    function navigateToHome() {
        navigationHistory = [];
        renderHome();
    }

    function updateBreadcrumbs() {
        breadcrumbs.innerHTML = '<span class="crumb" data-path="root">Home</span>';
        
        navigationHistory.forEach(item => {
            breadcrumbs.innerHTML += `<span class="crumb" data-id="${item.id}">${item.name}</span>`;
        });
        
        // Add click events to breadcrumbs
        document.querySelectorAll('.crumb').forEach(crumb => {
            crumb.addEventListener('click', function() {
                if (this.dataset.path === 'root') {
                    navigateToHome();
                } else {
                    // Navigate to specific folder
                    const folderId = this.dataset.id;
                    const index = navigationHistory.findIndex(item => item.id === folderId);
                    
                    if (index !== -1) {
                        navigationHistory = navigationHistory.slice(0, index + 1);
                        openFolder(folderId);
                    }
                }
            });
        });
    }

    function clearFolders() {
        foldersContainer.innerHTML = '';
    }

    function clearDocuments() {
        documentsContainer.innerHTML = '';
    }

    function showEmptyState(title = 'No content yet', message = 'Create folders to organize your machine manuals') {
        emptyState.querySelector('h3').textContent = title;
        emptyState.querySelector('p').textContent = message;
        emptyState.style.display = 'flex';
    }

    function hideEmptyState() {
        emptyState.style.display = 'none';
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
            return 'Today';
        } else if (diffDays === 1) {
            return 'Yesterday';
        } else if (diffDays < 7) {
            return `${diffDays} days ago`;
        } else {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }
    }

    // Password and Admin functions
    function showPasswordModalForCreateFolder() {
        document.getElementById('modal-title').textContent = 'Authentication Required';
        document.getElementById('password-error').textContent = '';
        document.getElementById('password-input').value = '';
        showModal(passwordModal);
        // Set action type
        document.getElementById('password-submit').dataset.action = 'create-folder';
    }

    function showPasswordModalForUpload() {
        document.getElementById('modal-title').textContent = 'Authentication Required';
        document.getElementById('password-error').textContent = '';
        document.getElementById('password-input').value = '';
        showModal(passwordModal);
        // Set action type
        document.getElementById('password-submit').dataset.action = 'upload';
    }

    function checkPassword() {
        const password = document.getElementById('password-input').value;
        const errorElement = document.getElementById('password-error');
        const action = document.getElementById('password-submit').dataset.action;
        
        // Demo password check (in a real app, this would be server-side)
        if (password === '1234') {
            closeAllModals();
            
            if (action === 'create-folder') {
                showModal(folderModal);
            } else if (action === 'upload') {
                showModal(uploadModal);
            }
        } else {
            errorElement.textContent = 'Incorrect password. Please try again.';
            document.getElementById('password-input').value = '';
        }
    }

    function createFolder() {
        const folderName = document.getElementById('folder-name').value;
        const folderDescription = document.getElementById('folder-description').value;
        
        if (!folderName.trim()) {
            alert('Please enter a folder name');
            return;
        }
        
        // Create new folder
        const newFolderId = 'folder' + (foldersData.length + 1);
        const newFolder = {
            id: newFolderId,
            name: folderName,
            description: folderDescription || '',
            count: 0,
            date: new Date().toISOString().split('T')[0]
        };
        
        foldersData.push(newFolder);
        documentsData[newFolderId] = [];
        
        // Save changes to localStorage
        saveToLocalStorage();
        
        // Update UI
        closeAllModals();
        renderHome();
        
        // Clear form fields
        document.getElementById('folder-name').value = '';
        document.getElementById('folder-description').value = '';
    }

    function uploadFile() {
        const fileInput = document.querySelector('.file-input');
        
        if (!fileInput.files.length) {
            alert('Please select at least one file to upload');
            return;
        }
        
        if (!currentFolderId) {
            alert('Please select a folder first. Click on a folder before uploading.');
            closeAllModals();
            return;
        }
        
        // Get progress elements, with null checks
        const uploadProgress = document.querySelector('.upload-progress');
        const progressBar = document.querySelector('.progress-bar-fill');
        const progressText = document.querySelector('.progress-percentage');
        
        // Only try to update progress UI if elements exist
        if (uploadProgress && progressBar && progressText) {
        uploadProgress.classList.remove('hidden');
        progressBar.style.width = '0%';
        progressText.textContent = '0%';
        }
        
        // Make sure the folder's document array exists
        if (!documentsData[currentFolderId]) {
            documentsData[currentFolderId] = [];
        }
        
        const files = Array.from(fileInput.files);
        let processedFiles = 0;
        
        // Upload each file
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const fileName = file.name;
                const fileTitle = fileName.split('.')[0]; // Use filename as title
                const fileExt = fileName.split('.').pop().toLowerCase();
                
            // Create unique ID
            const uniqueId = Date.now() + i; // Simple but effective for this use case
                const newDocId = 'doc' + uniqueId;
                
                // Create new document object
                const newDoc = {
                    id: newDocId,
                    title: fileTitle,
                    version: 'v1.0',
                    type: fileExt,
                    size: formatFileSize(file.size),
                    date: new Date().toISOString().split('T')[0]
                };
                
                // Add to the current folder
                documentsData[currentFolderId].push(newDoc);
                
            // Update progress if UI elements exist
            if (progressBar && progressText) {
                processedFiles++;
                const progress = Math.floor((processedFiles / files.length) * 100);
                progressBar.style.width = progress + '%';
                progressText.textContent = progress + '%';
            }
            }
            
            // Update folder metadata
            const folderIndex = foldersData.findIndex(f => f.id === currentFolderId);
            if (folderIndex !== -1) {
                foldersData[folderIndex].count = documentsData[currentFolderId].length;
                foldersData[folderIndex].date = new Date().toISOString().split('T')[0];
            }
            
            // Save to localStorage
            saveToLocalStorage();
            
            // Complete the upload process
            setTimeout(() => {
                closeAllModals();
                openFolder(currentFolderId); // Refresh current folder view
                
                // Clear form fields
                fileInput.value = '';
            const filePreview = document.querySelector('.file-preview');
            if (filePreview) {
                filePreview.innerHTML = '';
        }
        }, 500);
    }

    function handleFileSelect() {
        const fileInput = document.querySelector('.file-input');
        const filePreview = document.querySelector('.file-preview');
        
        if (fileInput.files.length) {
            filePreview.innerHTML = '<div class="selected-files"></div>';
            const selectedFiles = filePreview.querySelector('.selected-files');
            
            Array.from(fileInput.files).forEach(file => {
            const fileName = file.name;
            const fileSize = formatFileSize(file.size);
            const fileType = fileName.split('.').pop().toLowerCase();
            
                const fileElement = document.createElement('div');
                fileElement.className = 'selected-file';
                fileElement.innerHTML = `
                    <div class="file-icon">
                        <i class="fas ${getFileIcon(fileType)}"></i>
                    </div>
                    <div class="file-info">
                        <div class="file-name">${fileName}</div>
                        <div class="file-size">${fileSize}</div>
                    </div>
                    <div class="file-actions">
                    <div class="file-action remove-file" title="Remove file">
                        <i class="fas fa-times-circle"></i>
                    </div>
                </div>
            `;
            
                selectedFiles.appendChild(fileElement);
            
            // Add click event to the remove button
                const removeBtn = fileElement.querySelector('.remove-file');
            if (removeBtn) {
                removeBtn.addEventListener('click', function(e) {
                    e.stopPropagation(); // Prevent triggering the file input
                        fileElement.remove();
                        
                        // If all files are removed, clear the input
                        if (selectedFiles.children.length === 0) {
                    fileInput.value = '';
                    filePreview.innerHTML = '';
                        }
                });
            }
            });
        } else {
            filePreview.innerHTML = '';
        }
    }

    function getFileIcon(fileType) {
        switch(fileType) {
            case 'pdf': return 'fa-file-pdf';
            case 'doc':
            case 'docx': return 'fa-file-word';
            case 'xls':
            case 'xlsx': return 'fa-file-excel';
            case 'jpg':
            case 'jpeg':
            case 'png': return 'fa-file-image';
            default: return 'fa-file';
        }
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    // Delete functionality
    function showDeleteConfirmation(type, id, name) {
        const title = document.getElementById('delete-title');
        const message = document.getElementById('delete-message');
        const deleteError = document.getElementById('delete-error');
        
        // Set item to delete
        itemToDelete = { type, id };
        
        // Reset error message and password field
        deleteError.textContent = '';
        document.getElementById('delete-password').value = '';
        
        // Set modal content based on type
        if (type === 'folder') {
            title.textContent = 'Delete Folder';
            message.textContent = `Are you sure you want to delete the folder "${name}" and all its contents? This action cannot be undone.`;
        } else {
            title.textContent = 'Delete Manual';
            message.textContent = `Are you sure you want to delete the manual "${name}"? This action cannot be undone.`;
        }
        
        // Show modal
        showModal(deleteModal);
    }

    function confirmDelete() {
        const password = document.getElementById('delete-password').value;
        const errorElement = document.getElementById('delete-error');
        
        if (password === '1234') {
            if (itemToDelete.type === 'folder') {
                deleteFolder(itemToDelete.id);
            } else {
                deleteDocument(itemToDelete.id);
            }
            closeAllModals();
        } else {
            errorElement.textContent = 'Incorrect password. Please try again.';
            document.getElementById('delete-password').value = '';
        }
    }

    function deleteFolder(folderId) {
        // Remove folder from data
        foldersData = foldersData.filter(folder => folder.id !== folderId);
        
        // Remove the folder's documents
        delete documentsData[folderId];
        
        // Save changes to localStorage
        saveToLocalStorage();
        
        // Update UI
        if (currentFolderId === folderId) {
            // If we were inside the deleted folder, go back to home
            navigateToHome();
        } else {
            // Otherwise just refresh the current view
            renderHome();
        }
    }

    function deleteDocument(docId) {
        if (!currentFolderId) return;
        
        // Find the document in the current folder
        const docIndex = documentsData[currentFolderId].findIndex(doc => doc.id === docId);
        
        if (docIndex !== -1) {
            // Remove the document
            documentsData[currentFolderId].splice(docIndex, 1);
            
            // Update folder metadata
            const folderIndex = foldersData.findIndex(f => f.id === currentFolderId);
            if (folderIndex !== -1) {
                foldersData[folderIndex].count--;
                foldersData[folderIndex].date = new Date().toISOString().split('T')[0];
            }
            
            // Save changes to localStorage
            saveToLocalStorage();
            
            // Refresh the current folder view
            openFolder(currentFolderId);
        }
    }

    function showModal(modal) {
        // Close any open modals first
        closeAllModals();
        
        // Show the requested modal
        modal.style.display = 'flex';
        
        // Ensure modals are scrollable
        updateModalScrollability();
        
        // Add event listener to close when clicking outside
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeAllModals();
            }
        });
    }

    function closeAllModals() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.style.display = 'none';
        });
    }

    // Close modals when pressing escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });

    function downloadDocument(docId, title, fileType) {
        // Find the document
        let doc;
        if (currentFolderId) {
            doc = documentsData[currentFolderId].find(d => d.id === docId);
        } else {
            // If not in a folder view, search all folders
            for (const folderId in documentsData) {
                const found = documentsData[folderId].find(d => d.id === docId);
                if (found) {
                    doc = found;
                    break;
                }
            }
        }
        
        if (!doc) {
            alert('Document not found');
                return;
            }
            
        if (doc.fileData) {
            // If we have actual file data
            const downloadLink = document.createElement('a');
            downloadLink.href = doc.fileData;
            downloadLink.download = `${title}.${fileType}`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            
            // Clean up the object URL if it's a blob URL
            if (doc.fileData.startsWith('blob:')) {
                setTimeout(() => {
                    URL.revokeObjectURL(downloadLink.href);
                }, 100);
            }
        } else {
            // For demo documents without real file data
            let content = `This is a sample ${fileType.toUpperCase()} file for "${title}" (ID: ${docId}).\n\n`;
            content += "In a real application, this would be the actual file content.\n";
            content += "TechDocs - Industrial Documentation Portal\n";
            
            // Create a Blob with the content
            const blob = new Blob([content], { type: 'text/plain' });
            
            // Create a download link
            const downloadLink = document.createElement('a');
            downloadLink.href = URL.createObjectURL(blob);
            downloadLink.download = `${title}.${fileType}`;
            
            // Append to body, click and remove
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            
            // Clean up the object URL
            setTimeout(() => {
                URL.revokeObjectURL(downloadLink.href);
            }, 100);
        }
    }

    // Rename functionality
    function showRenameModal(type, id, currentName) {
        const renameTitle = document.getElementById('rename-title');
        const renameInput = document.getElementById('rename-input');
        
        // Set item to rename
        itemToRename = { type, id };
        
        // Set modal content based on type
        if (type === 'folder') {
            renameTitle.textContent = 'Rename Folder';
        } else {
            renameTitle.textContent = 'Rename Manual';
        }
        
        // Set current name in the input
        renameInput.value = currentName;
        
        // Show modal
        showModal(renameModal);
        
        // Focus input
        setTimeout(() => renameInput.focus(), 100);
    }

    function confirmRename() {
        const newName = document.getElementById('rename-input').value.trim();
        
        if (!newName) {
            alert('Please enter a name');
            return;
        }
        
        if (itemToRename.type === 'folder') {
            renameFolder(itemToRename.id, newName);
        } else {
            renameDocument(itemToRename.id, newName);
        }
        
        closeAllModals();
    }

    function renameFolder(folderId, newName) {
        // Find and update the folder
        const folderIndex = foldersData.findIndex(folder => folder.id === folderId);
        if (folderIndex !== -1) {
            foldersData[folderIndex].name = newName;
            foldersData[folderIndex].date = new Date().toISOString().split('T')[0];
            
            // Save changes to localStorage
            saveToLocalStorage();
            
            // Update UI
            if (currentFolderId === folderId) {
                // If we're inside this folder, update breadcrumbs
                navigationHistory = navigationHistory.map(item => {
                    if (item.id === folderId) {
                        return { ...item, name: newName };
                    }
                    return item;
                });
                updateBreadcrumbs();
            }
            
            // Refresh the view
            if (currentFolderId) {
                openFolder(currentFolderId);
            } else {
                renderHome();
            }
        }
    }

    function renameDocument(docId, newName) {
        if (!currentFolderId) return;
        
        // Find and update the document
        const docIndex = documentsData[currentFolderId].findIndex(doc => doc.id === docId);
        if (docIndex !== -1) {
            documentsData[currentFolderId][docIndex].title = newName;
            documentsData[currentFolderId][docIndex].date = new Date().toISOString().split('T')[0];
            
            // Update folder metadata for last update date
            const folderIndex = foldersData.findIndex(f => f.id === currentFolderId);
            if (folderIndex !== -1) {
                foldersData[folderIndex].date = new Date().toISOString().split('T')[0];
            }
            
            // Save changes to localStorage
            saveToLocalStorage();
            
            // Refresh the view
            openFolder(currentFolderId);
        }
    }

    // QR Code functionality
    function showQRCode(folderId, folderName) {
        const qrContainer = document.getElementById('qrcode-container');
        const folderNameElement = document.getElementById('qr-folder-name');
        
        // Clear previous QR code
        qrContainer.innerHTML = '';
        
        // Set folder name in the modal
        folderNameElement.textContent = folderName;
        
        // Generate QR code data
        const currentUrl = window.location.href.split('?')[0]; // Base URL without parameters
        const qrData = `${currentUrl}?folder=${folderId}`;
        
        // Show modal first
        showModal(qrModal);
        
        // Create a canvas element for the QR code
        const canvas = document.createElement('canvas');
        canvas.id = 'qr-canvas';
        qrContainer.appendChild(canvas);
        
        // Wait for QRious library to load, then generate the code
        const generateQR = () => {
            if (typeof QRious !== 'undefined') {
                new QRious({
                    element: canvas,
                    value: qrData,
                    size: 200,
                    backgroundAlpha: 1,
                    foreground: '#4f46e5',
                    level: 'H'
                });
            } else {
                // If library not loaded yet, wait and try again
                setTimeout(generateQR, 200);
            }
        };
        
        generateQR();
    }

    function downloadQRCode() {
        const qrCanvas = document.getElementById('qr-canvas');
        const folderName = document.getElementById('qr-folder-name').textContent;
        
        if (qrCanvas) {
            // Create a temporary link
            const link = document.createElement('a');
            link.download = `QR-${folderName.replace(/\s+/g, '-')}.png`;
            
            // Convert canvas to data URL
            link.href = qrCanvas.toDataURL('image/png');
            
            // Append, click and remove
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    // Check for folder parameter in URL on page load (for QR code scanning)
    function checkUrlForFolderParam() {
        const urlParams = new URLSearchParams(window.location.search);
        const folderId = urlParams.get('folder');
        
        if (folderId) {
            // Check if folder exists
            const folder = foldersData.find(f => f.id === folderId);
            if (folder) {
                // Open the folder
                setTimeout(() => openFolder(folderId), 500);
                
                // Clear the URL parameter (without refreshing)
                const newUrl = window.location.pathname;
                window.history.replaceState({}, document.title, newUrl);
            }
        }
    }
    
    // Call this function on page load
    checkUrlForFolderParam();

    // Add this function to your script
    function updateModalScrollability() {
        // Find all modal content elements
        const modalContents = document.querySelectorAll('.modal-content');
        
        modalContents.forEach(content => {
            // Add max-height and overflow properties
            content.style.maxHeight = '80vh';
            content.style.overflowY = 'auto';
        });
        
        // Specifically target the upload modal content
        const uploadModalContent = document.querySelector('#upload-modal .modal-content');
        if (uploadModalContent) {
            uploadModalContent.style.maxHeight = '80vh';
            uploadModalContent.style.overflowY = 'auto';
            
            // Also make sure the modal body is scrollable
            const modalBody = uploadModalContent.querySelector('.modal-body');
            if (modalBody) {
                modalBody.style.maxHeight = '60vh';
                modalBody.style.overflowY = 'auto';
            }
        }
    }
});
