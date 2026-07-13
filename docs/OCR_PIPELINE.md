# OCR Pipeline

```mermaid
sequenceDiagram
  participant U as User
  participant W as Web app
  participant C as Canvas processor
  participant O as OCR provider
  participant P as Parser/matcher
  participant A as Admin

  U->>W: Upload JPEG/PNG/WebP
  W->>W: Validate MIME by file signature
  U->>W: Select image type, crop, rotate, adjust contrast
  W->>C: Re-encode image to remove metadata
  C-->>W: Processed image + SHA-256
  W->>O: Run local OCR
  O-->>W: Raw OCR text + confidence
  U->>W: Correct text manually
  W->>P: Parse and match tokens
  P-->>W: Confirmed, uncertain, unresolved tokens
  U->>W: Choose contribution mode
  W->>A: Pending review submission
```

## Controls

- Supported files: JPEG, PNG, WebP.
- Validation uses magic bytes, not filename alone.
- Browser canvas re-encoding strips EXIF/GPS metadata for processed images.
- Original images are not saved unless the user selects the processed-image contribution option.
- OCR output and corrected text are stored separately.
- OCR results are never published without confirmation and review.

## Providers

- `BrowserTesseractOcrProvider`: first free local provider.
- `DeterministicOcrProvider`: stable tests and demos.
