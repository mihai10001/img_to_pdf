"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Upload, X, FileImage, FilePlus } from "lucide-react"
import { jsPDF } from "jspdf"

export function ImageToPdfConverter() {
  const [images, setImages] = useState<{ file: File; url: string }[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map((file) => ({
        file,
        url: URL.createObjectURL(file),
      }))
      setImages((prev) => [...prev, ...newFiles])
    }
  }

  const removeImage = (index: number) => {
    setImages((prev) => {
      const newImages = [...prev]
      URL.revokeObjectURL(newImages[index].url)
      newImages.splice(index, 1)
      return newImages
    })
  }

  const generatePdf = async () => {
    if (images.length === 0) return

    setIsGenerating(true)

    try {
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4", // A4 format
      })

      // Process each image
      for (let i = 0; i < images.length; i++) {
        // Add a new page for each image after the first one
        if (i > 0) {
          pdf.addPage()
        }

        // Create an image element to get dimensions
        const img = new Image()
        img.src = images[i].url

        await new Promise<void>((resolve) => {
          img.onload = () => {
            // Get page dimensions
            const pageWidth = pdf.internal.pageSize.getWidth()
            const pageHeight = pdf.internal.pageSize.getHeight()

            // Calculate dimensions to maximize width while maintaining aspect ratio
            const imgRatio = img.height / img.width

            // Use full page width
            const finalWidth = pageWidth

            // Calculate height based on original aspect ratio
            const finalHeight = pageWidth * imgRatio

            // Center vertically
            const x = 0 // Start from left edge
            const y = (pageHeight - finalHeight) / 2 // Center vertically

            // Add the image to the PDF
            pdf.addImage(img, "JPEG", x, y, finalWidth, finalHeight)

            resolve()
          }

          img.crossOrigin = "anonymous"
        })
      }

      // Save the PDF
      pdf.save("images.pdf")
    } catch (error) {
      console.error("Error generating PDF:", error)
      alert("There was an error generating the PDF. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-6 max-w-3xl mx-auto">
      <Card className="w-full p-6 border-dashed border-2 bg-muted/50 flex flex-col items-center justify-center gap-4">
        <FileImage className="h-12 w-12 text-muted-foreground" />
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-1">Upload Images</h2>
          <p className="text-sm text-muted-foreground mb-4">Select multiple images to convert to a PDF</p>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            multiple
            accept="image/*"
            className="hidden"
          />
          <Button onClick={() => fileInputRef.current?.click()} className="gap-2">
            <Upload className="h-4 w-4" />
            Select Images
          </Button>
        </div>
      </Card>

      {images.length > 0 && (
        <>
          <div className="w-full">
            <h3 className="text-lg font-medium mb-3">Selected Images ({images.length})</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {images.map((image, index) => (
                <div key={index} className="relative group">
                  <div className="aspect-square rounded-md overflow-hidden border bg-background">
                    <img
                      src={image.url || "/placeholder.svg"}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeImage(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                  <p className="text-xs text-center mt-1 truncate">{image.file.name}</p>
                </div>
              ))}
              <div
                className="aspect-square rounded-md border border-dashed flex items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <FilePlus className="h-8 w-8 text-muted-foreground" />
              </div>
            </div>
          </div>

          <Button onClick={generatePdf} disabled={isGenerating} className="w-full max-w-xs mt-4" size="lg">
            {isGenerating ? "Generating PDF..." : "Generate PDF"}
          </Button>
        </>
      )}
    </div>
  )
}
