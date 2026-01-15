"use client";

import { useState, useEffect } from "react";
import { uploadBackgroundImage, getBackgroundImageUrl } from "@/lib/firebase/storage";

export default function AdminBackgroundImagePage() {
  const [loading, setLoading] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    loadCurrentImage();
  }, []);

  async function loadCurrentImage() {
    try {
      const url = await getBackgroundImageUrl();
      setCurrentImageUrl(url);
    } catch (error: any) {
      console.error("Erreur lors du chargement de l'image:", error);
    }
  }

  function showMessage(type: "success" | "error", text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  }

  function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showMessage("error", "Veuillez sélectionner une image.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showMessage("error", "L'image est trop volumineuse (max 10 MB).");
      return;
    }

    // Créer un aperçu
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === "string") {
        setPreview(result);
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleUpload() {
    const fileInput = document.getElementById("background-image-input") as HTMLInputElement;
    const file = fileInput?.files?.[0];
    
    if (!file) {
      showMessage("error", "Veuillez sélectionner une image.");
      return;
    }

    try {
      setLoading(true);
      const url = await uploadBackgroundImage(file);
      setCurrentImageUrl(url);
      setPreview(null);
      showMessage("success", "Image de fond uploadée avec succès ✅");
      
      // Réinitialiser l'input
      if (fileInput) {
        fileInput.value = "";
      }
    } catch (error: any) {
      showMessage("error", error.message || "Erreur lors de l'upload de l'image.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        background: "transparent", // Transparent pour voir l'image de fond
        color: "#fff",
        minHeight: "100vh",
        padding: "40px 20px",
        boxSizing: "border-box",
      }}
    >
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <h1 style={{ fontSize: 28, marginBottom: 10, color: "#10b981", textAlign: "center" }}>
          🖼️ Image de fond
        </h1>
        <p style={{ textAlign: "center", opacity: 0.8, marginBottom: 30, fontSize: 14 }}>
          Gérez l'image de fond de l'application
        </p>

        {message && (
          <div
            style={{
              background: message.type === "success" ? "#10b98120" : "#ef444420",
              border: `1px solid ${message.type === "success" ? "#10b981" : "#ef4444"}`,
              borderRadius: 12,
              padding: 15,
              marginBottom: 20,
              color: message.type === "success" ? "#10b981" : "#ef4444",
              textAlign: "center",
            }}
          >
            {message.text}
          </div>
        )}

        {/* Image actuelle */}
        {currentImageUrl && (
          <div
            style={{
              background: "rgba(31, 31, 31, 0.9)",
              border: "1px solid #2a2a2a",
              borderRadius: 12,
              padding: 20,
              marginBottom: 30,
            }}
          >
            <h2 style={{ fontSize: 18, marginTop: 0, marginBottom: 15 }}>Image actuelle</h2>
            <div
              style={{
                borderRadius: 8,
                overflow: "hidden",
                marginBottom: 15,
                border: "1px solid #2a2a2a",
              }}
            >
              <img
                src={currentImageUrl}
                alt="Image de fond actuelle"
                style={{
                  width: "100%",
                  height: "auto",
                  maxHeight: 300,
                  objectFit: "cover",
                  display: "block",
                }}
              />
            </div>
            <p style={{ fontSize: 13, opacity: 0.7, margin: 0 }}>
              Cette image est utilisée comme fond sur toutes les pages de l'application.
            </p>
          </div>
        )}

        {/* Formulaire d'upload */}
        <div
          style={{
            background: "rgba(31, 31, 31, 0.9)",
            border: "1px solid #2a2a2a",
            borderRadius: 12,
            padding: 20,
            marginBottom: 30,
          }}
        >
          <h2 style={{ fontSize: 18, marginTop: 0, marginBottom: 15 }}>📤 Uploader une nouvelle image</h2>
          
          <div style={{ display: "grid", gap: 15 }}>
            <div>
              <label
                htmlFor="background-image-input"
                style={{
                  display: "block",
                  marginBottom: 8,
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                Sélectionner une image
              </label>
              <input
                id="background-image-input"
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                disabled={loading}
                style={{
                  width: "100%",
                  padding: 12,
                  borderRadius: 10,
                  border: "1px solid #2a2a2a",
                  background: "#141414",
                  color: "#fff",
                  fontSize: 14,
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.5 : 1,
                }}
              />
              <p style={{ fontSize: 12, opacity: 0.7, marginTop: 8, marginBottom: 0 }}>
                Formats acceptés: JPG, PNG, WebP (max 10 MB)
              </p>
            </div>

            {preview && (
              <div
                style={{
                  background: "#141414",
                  border: "1px solid #2a2a2a",
                  borderRadius: 8,
                  padding: 15,
                }}
              >
                <p style={{ fontSize: 13, marginBottom: 10, opacity: 0.8 }}>Aperçu:</p>
                <img
                  src={preview}
                  alt="Aperçu"
                  style={{
                    width: "100%",
                    height: "auto",
                    maxHeight: 200,
                    objectFit: "cover",
                    borderRadius: 8,
                  }}
                />
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={loading || !preview}
              style={{
                padding: "12px 20px",
                borderRadius: 10,
                border: "1px solid #10b981",
                background: loading || !preview ? "#2a2a2a" : "#10b981",
                color: "#fff",
                fontSize: 14,
                fontWeight: 600,
                cursor: loading || !preview ? "not-allowed" : "pointer",
                opacity: loading || !preview ? 0.5 : 1,
              }}
            >
              {loading ? "Upload en cours..." : "📤 Uploader l'image"}
            </button>
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: 30 }}>
          <a
            href="/"
            style={{
              color: "#3b82f6",
              textDecoration: "underline",
              fontSize: 14,
            }}
          >
            ← Retour à l'accueil
          </a>
        </div>
      </div>
    </div>
  );
}
