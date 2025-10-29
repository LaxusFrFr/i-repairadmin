// Cloudinary configuration for Web Admin Panel
const CLOUDINARY_CONFIG = {
  cloud_name: 'dkcvorlme', // Your actual Cloudinary cloud name
  upload_preset: 'irepair_uploads', // Your upload preset
};

// Upload function for Web using direct API calls
export const uploadToCloudinary = async (file: File, folder: string, publicId: string): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_CONFIG.upload_preset);
    formData.append('folder', folder);
    formData.append('public_id', publicId);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloud_name}/image/upload`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    
    if (data.secure_url) {
      return data.secure_url;
    } else {
      throw new Error(`Upload failed: ${data.error?.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

// Function to update Cloudinary configuration
export const updateCloudinaryConfig = (cloudName: string, uploadPreset: string) => {
  CLOUDINARY_CONFIG.cloud_name = cloudName;
  CLOUDINARY_CONFIG.upload_preset = uploadPreset;
};

