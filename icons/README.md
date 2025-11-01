# Extension Icons

Place your extension icons here:
- `icon16.png` - 16x16 pixels (toolbar icon)
- `icon48.png` - 48x48 pixels (extension management page)
- `icon128.png` - 128x128 pixels (Chrome Web Store)

## Creating Icons

You can create icons using:
1. Any image editor (Photoshop, Figma, Canva, etc.)
2. Online icon generators
3. The command line with ImageMagick

### Quick Icon Creation

For testing, you can create simple colored squares:

**Using ImageMagick (if installed):**
```bash
# Create a simple gradient icon
convert -size 128x128 gradient:'#667eea'-'#764ba2' icon128.png
convert icon128.png -resize 48x48 icon48.png
convert icon128.png -resize 16x16 icon16.png
```

**Using online tools:**
- https://www.favicon-generator.org/
- https://favicon.io/
- https://www.canva.com/

**Design Tips:**
- Use the Study Buddy theme colors: #667eea (purple-blue) and #764ba2 (purple)
- Include a simple book, lightbulb, or graduation cap icon
- Keep it simple and recognizable at small sizes
- Use transparent background (PNG format)
