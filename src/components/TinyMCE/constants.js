/**
 * Cấu hình chung cho TinyMCE editor
 * @author: HoTram  
 */
export const TINYMCE_CONFIG_NEW = {
  plugins: [
    'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
    'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
    'insertdatetime', 'media', 'table', 'help', 'wordcount', 'emoticons'
  ],
  toolbar: [
    'undo redo | blocks fontsize fontfamily | bold italic underline strikethrough | forecolor backcolor | removeformat',
    'alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image imageupload media table | fullscreen preview code | help emoticons'
  ],
  content_style: `
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif; 
      font-size: 14px; 
      line-height: 1.6; 
      color: #1f2937; 
      margin: 0; 
      padding: 16px; 
    }
    p { margin: 0 0 12px 0; }
    h1, h2, h3, h4, h5, h6 { margin: 0 0 16px 0; font-weight: 600; }
    ul, ol { margin: 0 0 12px 0; padding-left: 24px; }
    li { margin: 0 0 4px 0; }
  `,
  branding: false,
  statusbar: false,
  menubar: false,
  resize: false,
  language: 'vi',
  promotion: false,
  promotion_url: false,
  width: '100%',
  height: '100%',
  min_height: 400,
  fontsize_formats: '8pt 9pt 10pt 11pt 12pt 14pt 16pt 18pt 20pt 22pt 24pt 26pt 28pt 36pt 48pt 72pt',
  block_formats: 'Paragraph=p; Heading 1=h1; Heading 2=h2; Heading 3=h3; Heading 4=h4; Heading 5=h5; Heading 6=h6',
  
  // Enable paste images
  paste_data_images: true,
  
  // Image tools
  image_advtab: true,
  image_caption: true,
  image_title: true,
  
  // Media configuration
  media_live_embeds: true,
  
  setup: function (editor) {
    editor.on('init', function () {
      editor.getContainer().style.transition = 'all 0.2s ease-in-out';
    });
    
    // Compress pasted images
    editor.on('paste', function (e) {
      setTimeout(function() {
        const images = editor.dom.select('img');
        images.forEach(function(img) {
          if (img.src && img.src.startsWith('data:') && img.src.length > 100000) { // Only compress large images
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const newImg = new Image();
            
            newImg.onload = function() {
              const maxWidth = 800;
              const maxHeight = 600;
              let { width, height } = newImg;
              
              if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
              }
              if (height > maxHeight) {
                width = (width * maxHeight) / height;
                height = maxHeight;
              }
              
              canvas.width = width;
              canvas.height = height;
              ctx.drawImage(newImg, 0, 0, width, height);
              
              const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
              img.src = compressedDataUrl;
            };
            
            newImg.src = img.src;
          }
        });
      }, 100);
    });
    
      // Add custom image upload button
      editor.ui.registry.addButton('imageupload', {
        icon: 'image',
        tooltip: 'Upload ảnh từ máy',
        onAction: function () {
          const input = document.createElement('input');
          input.setAttribute('type', 'file');
          input.setAttribute('accept', 'image/*');
          input.style.display = 'none';
          document.body.appendChild(input);
          input.click();
          
          input.onchange = function() {
            const file = input.files[0];
            if (file) {
              // Check file size (max 5MB)
              if (file.size > 5 * 1024 * 1024) {
                alert('File ảnh quá lớn. Vui lòng chọn file nhỏ hơn 5MB.');
                return;
              }
              
              // Check file type
              if (!file.type.startsWith('image/')) {
                alert('Vui lòng chọn file ảnh hợp lệ.');
                return;
              }
              
              // Compress image before upload
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              const img = new Image();
              
              img.onload = function() {
                // Calculate new dimensions (max 800px width)
                const maxWidth = 800;
                const maxHeight = 600;
                let { width, height } = img;
                
                if (width > maxWidth) {
                  height = (height * maxWidth) / width;
                  width = maxWidth;
                }
                if (height > maxHeight) {
                  width = (width * maxHeight) / height;
                  height = maxHeight;
                }
                
                // Set canvas dimensions
                canvas.width = width;
                canvas.height = height;
                
                // Draw and compress
                ctx.drawImage(img, 0, 0, width, height);
                
                // Convert to base64 with compression (quality 0.7 = 70%)
                const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
                
                // Insert compressed image
                editor.insertContent('<img src="' + compressedDataUrl + '" alt="Uploaded image" style="max-width: 100%; height: auto;" />');
              };
              
              img.onerror = function() {
                alert('Không thể xử lý file ảnh. Vui lòng thử lại.');
              };
              
              // Load image for compression
              const reader = new FileReader();
              reader.onload = function() {
                img.src = reader.result;
              };
              reader.onerror = function() {
                alert('Không thể đọc file ảnh. Vui lòng thử lại.');
              };
              reader.readAsDataURL(file);
            }
            // Clean up
            document.body.removeChild(input);
          };
        }
      });
  }
};

export const TINYMCE_KEY = import.meta.env.VITE_TINYMCE_KEY;

export const BASE_CDN_TINYMCE_URL = `https://cdn.tiny.cloud/1/${import.meta.env.VITE_TINYMCE_KEY}/tinymce/7/tinymce.min.js`;
