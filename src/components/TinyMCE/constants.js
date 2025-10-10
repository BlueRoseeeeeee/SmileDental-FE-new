/**
 * Cấu hình chung cho TinyMCE editor
 * @author: HoTram  
 */
export const TINYMCE_CONFIG_NEW = {
  plugins: [
    'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
    'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
    'insertdatetime', 'media', 'table', 'help', 'wordcount', 'emoticons',
    'paste', 'imagetools'
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
  max_width: '100%',
  min_height: 400,
  fontsize_formats: '8pt 9pt 10pt 11pt 12pt 14pt 16pt 18pt 20pt 22pt 24pt 26pt 28pt 36pt 48pt 72pt',
  block_formats: 'Paragraph=p; Heading 1=h1; Heading 2=h2; Heading 3=h3; Heading 4=h4; Heading 5=h5; Heading 6=h6',
  
  // Disable default image upload handler
  images_upload_handler: false,
  
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
              
              const reader = new FileReader();
              reader.onload = function() {
                editor.insertContent('<img src="' + reader.result + '" alt="Uploaded image" style="max-width: 100%; height: auto;" />');
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
