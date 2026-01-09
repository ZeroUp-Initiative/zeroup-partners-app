/**
 * Image Upload Utility
 * 
 * Uses the ZeroUp Image Upload API to upload images to Cloudinary.
 * API: https://zeroup-image-upload-api.vercel.app/upload
 * 
 * @param file - The image file to upload
 * @returns Promise<string> - The URL of the uploaded image
 */

const IMAGE_UPLOAD_API_URL = "https://zeroup-image-upload-api.vercel.app/upload";

export async function uploadImage(file: File): Promise<string> {
  try {
    // Create form data with 'image' as the key
    const formData = new FormData();
    formData.append("image", file);

    const response = await fetch(IMAGE_UPLOAD_API_URL, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    // The API should return the Cloudinary URL
    // Adjust based on the actual response structure from your API
    if (data.url) {
      return data.url;
    } else if (data.secure_url) {
      return data.secure_url;
    } else if (data.imageUrl) {
      return data.imageUrl;
    } else if (data.link) {
      return data.link;
    } else {
      // If the response is the URL directly
      console.log("API Response:", data);
      throw new Error("Could not find image URL in response");
    }
  } catch (error) {
    console.error("Image upload error:", error);
    throw error;
  }
}

/**
 * Validate image file before upload
 * 
 * @param file - The file to validate
 * @param maxSizeMB - Maximum file size in MB (default: 10)
 * @returns boolean - True if valid
 */
export function validateImageFile(file: File, maxSizeMB: number = 10): { valid: boolean; error?: string } {
  const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp", "application/pdf"];
  
  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: "Invalid file type. Please upload JPG, PNG, GIF, WebP, or PDF files."
    };
  }
  
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size exceeds ${maxSizeMB}MB limit.`
    };
  }
  
  return { valid: true };
}
