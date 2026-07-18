import sys
try:
    from PIL import Image
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "Pillow"])
    from PIL import Image

img = Image.open('assets/stealth-icon.jpg')
width, height = img.size

# Gemini watermarks are usually in the bottom right corner.
# The image itself might have white borders.
# Let's crop 8% from all sides to be safe and remove borders/watermark.
margin_x = int(width * 0.08)
margin_y = int(height * 0.08)

left = margin_x
top = margin_y
right = width - margin_x
bottom = height - margin_y

img = img.crop((left, top, right, bottom))

# Save as PNG
img.save('assets/icon.png', format='PNG')
img.save('assets/adaptive-icon.png', format='PNG')
img.save('assets/splash.png', format='PNG')

print("Cropped image saved to assets/icon.png, adaptive-icon.png, and splash.png")
