// Define loadExistingFiles in the global scope first
function loadExistingFiles() {
    fetch('/files')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            const filesList = document.getElementById('files');
            // Clear the current list
            filesList.innerHTML = '';
            
            if (!data.files || data.files.length === 0) {
                filesList.innerHTML = '<div class="file-item">No files uploaded yet</div>';
                return;
            }
            
            // Add each file to the list
            data.files.forEach(file => {
                const fileItem = document.createElement('div');
                fileItem.className = 'file-item';
                
                // Format the file size
                const formatFileSize = (bytes) => {
                    if (bytes === 0) return '0 Bytes';
                    const k = 1024;
                    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
                    const i = Math.floor(Math.log(bytes) / Math.log(k));
                    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
                };
                
                // Format the date
                const formatDate = (dateString) => {
                    const date = new Date(dateString);
                    return date.toLocaleString();
                };
                
                fileItem.innerHTML = `
                    <span>
                        <a href="${file.downloadUrl}" download="${file.name}">${file.name}</a> 
                        (${formatFileSize(file.size)})
                    </span>
                    <span>Uploaded: ${formatDate(file.lastModified)}</span>
                `;
                filesList.appendChild(fileItem);
            });
        })
        .catch(error => {
            console.error('Error loading files:', error);
            document.getElementById('files').innerHTML = '<div class="file-item error">Error loading files: ' + error.message + '</div>';
        });
}

document.addEventListener('DOMContentLoaded', () => {
    const dropArea = document.getElementById('drop-area');
    const fileInput = document.getElementById('fileInput');
    const browseButton = document.getElementById('browseButton');
    const refreshButton = document.getElementById('refreshButton');
    const filesList = document.getElementById('files');

    // Add click event listener to refresh button
    refreshButton.addEventListener('click', loadExistingFiles);

    // Load existing files when page loads
    loadExistingFiles();

    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    // Highlight drop area when item is dragged over it
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });

    // Handle dropped files
    dropArea.addEventListener('drop', handleDrop, false);
    
    // Handle browse button click
    browseButton.addEventListener('click', () => {
        fileInput.click();
    });
    
    // Handle file selection via browse button
    fileInput.addEventListener('change', handleFiles, false);

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function highlight() {
        dropArea.classList.add('highlight');
    }

    function unhighlight() {
        dropArea.classList.remove('highlight');
    }

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles({ target: { files } });
    }

    function handleFiles(e) {
        const files = [...e.target.files];
        files.forEach(uploadFile);
    }

    function uploadFile(file) {
        const formData = new FormData();
        formData.append('file', file);
        
        // Create a file item in the list
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
            <span>${file.name} (${formatFileSize(file.size)})</span>
            <span class="status">Uploading...</span>
        `;
        filesList.appendChild(fileItem);
        
        // Send the file to the server
        fetch('/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            fileItem.querySelector('.status').textContent = 'Uploaded';
            fileItem.querySelector('.status').className = 'status success';
            // Reload the file list to show the new file
            loadExistingFiles();
        })
        .catch(error => {
            console.error('Error:', error);
            fileItem.querySelector('.status').textContent = 'Failed';
            fileItem.querySelector('.status').className = 'status error';
        });
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString();
    }
    
    // The loadExistingFiles function is now defined in the global scope
});