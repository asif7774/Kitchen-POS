# 🎨 Complete SVG Sprite System Guide

This guide provides everything you need to know about the SVG sprite system implemented in your React application.

## 📁 File Structure

```
public/
└── sprites/
    └── app-icons.svg                    # Main SVG sprite file (used in app)

src/
├── components/
│   ├── atoms/
│   │   └── svg-sprite-loader/
│   │       ├── svg-sprite-loader.tsx    # Main loader component
│   │       ├── SvgIcon.tsx              # Icon component
│   │       ├── index.ts                 # Exports
│   │       └── README.md                # Detailed documentation
│   └── examples/
│       └── SvgSpriteUsageExample.tsx    # Usage examples
├── types/
│   └── svg-sprite.ts                    # TypeScript definitions
└── utils/
    └── svgSpriteUtils.ts                # Utility functions

scripts/
└── generate-svg-sprite.js               # Sprite generator script
```

## 🚀 Quick Start

### 1. Basic Setup (Already Done)

The system is already integrated into your app:

```tsx
// In src/app/app.tsx
<SvgSpriteLoader 
  url="/sprites/app-icons.svg" 
  version="1.0.0"
  onError={(error) => console.error('❌ Failed to load SVG sprite:', error)}
>
  {/* Your app content */}
</SvgSpriteLoader>
```

The sprite file is located in `public/sprites/app-icons.svg` and is automatically served from the public directory.

### 2. Using Icons

```tsx
import { SvgIcon } from 'components/atoms/svg-sprite-loader';

// Basic usage
<SvgIcon 
  name="home" 
  width="24" 
  height="24" 
  fill="currentColor"
/>

// With styling and click handler
<SvgIcon 
  name="settings" 
  width="32" 
  height="32" 
  className="hover:text-blue-600 cursor-pointer"
  onClick={() => console.log('Settings clicked')}
/>
```

## 📚 Available Icons

### From `app-icons.svg` (Located in `public/sprites/app-icons.svg`)

The following icons are currently available in the main sprite file:

#### Navigation & UI
- `home`, `menu`, `close`, `settings`
- `arrow-right`

#### User & Authentication
- `user`, `users`, `logout`

#### Communication
- `mail`, `phone`, `bell`

#### Status & Feedback
- `check`, `check-circle`, `info`, `warning`, `success`, `loading`

#### Actions & Tools
- `wrench`, `clipboard`, `chart-bar`

#### Media & Content
- `star`

#### Time & Date
- `clock`, `calendar`

#### Location
- `location`

#### Utility
- `external-link`, `eye`, `eye-slash`

#### Custom Logos
- `logo`

**Note:** You can add more icons by either manually editing `public/sprites/app-icons.svg` or using the generator script (see below).

## 🛠️ Creating Your Own Icons

### Method 1: Manual Creation

If you prefer to add icons manually or need fine-grained control:

1. **Create your SVG icon** with a 24x24 viewBox (recommended):
   ```svg
   <svg fill="none" stroke="currentColor" stroke-width="2">
     <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
   </svg>
   ```

2. **Open** `public/sprites/app-icons.svg` in your editor

3. **Add a new `<symbol>` element** inside the root `<svg>` tag:
   ```svg
   <symbol id="my-icon" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
     <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
   </symbol>
   ```

4. **Important points**:
   - The `id` attribute is what you'll use in the `SvgIcon` component's `name` prop
   - Use `currentColor` for `fill` or `stroke` to allow CSS color inheritance
   - Add the symbol before the closing `</svg>` tag

5. **Update the version** in `app.tsx` to invalidate cache

### Method 2: Using the Generator Script (Recommended)

The generator script automatically converts individual SVG files into a sprite. This is the easiest way to add multiple icons at once.

#### Step-by-Step Workflow:

1. **Create an `icons/` directory** in your project root (if it doesn't exist):
   ```bash
   mkdir icons
   ```

2. **Place your individual SVG icon files** in the `icons/` directory:
   ```
   icons/
   ├── home.svg
   ├── user.svg
   ├── settings.svg
   └── star.svg
   ```

3. **Run the generator script**:
   ```bash
   # Using npm script (recommended)
   npm run generate-sprite
   
   # Or directly with node
   node scripts/generate-svg-sprite.js icons/ public/sprites/app-icons.svg
   
   # Or with custom paths
   node scripts/generate-svg-sprite.js my-icons/ public/sprites/custom-icons.svg
   ```

4. **The script will**:
   - Read all `.svg` files from the input directory
   - Extract viewBox and content from each file
   - Generate `<symbol>` elements with proper IDs
   - Combine everything into a single sprite file
   - Output to `public/sprites/app-icons.svg` (or your specified path)

5. **Update the version** in `app.tsx` to invalidate cache:
   ```tsx
   <SvgSpriteLoader 
     url="/sprites/app-icons.svg" 
     version="1.0.1"  // Increment this when you update icons
     ...
   />
   ```

#### How the Generator Works:

- **ID Generation**: File names are converted to kebab-case IDs
  - `My Icon.svg` → `my-icon`
  - `user-profile.svg` → `user-profile`
  - `icon@2x.svg` → `icon-2x`

- **Content Cleaning**: Removes unnecessary whitespace and normalizes the SVG content

- **Output**: Creates a properly formatted sprite file ready to use

#### Example Output:

After running the script, you'll see:
```
📁 Found 3 SVG files in 'icons'
✅ Processed: home → home
✅ Processed: user → user
✅ Processed: settings → settings

🎉 Successfully generated SVG sprite!
📄 Output file: public/sprites/app-icons.svg
📊 Processed: 3/3 icons
📏 File size: 2.45 KB
```

**Note:** The sprite file must be in the `public/sprites/` directory to be accessible at runtime via the URL path `/sprites/app-icons.svg`.

## 🎨 Styling Examples

### Basic Styling
```tsx
<SvgIcon 
  name="star" 
  width="24" 
  height="24" 
  className="text-yellow-500"
/>
```

### Hover Effects
```tsx
<SvgIcon 
  name="heart" 
  width="32" 
  height="32" 
  className="text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
  onClick={() => console.log('Liked!')}
/>
```

### Custom Styling with CSS
```tsx
<SvgIcon 
  name="star-filled" 
  width="48" 
  height="48" 
  className="text-yellow-500"
  style={{ 
    filter: 'drop-shadow(0 0 8px rgba(251, 191, 36, 0.5))',
    animation: 'pulse 2s infinite'
  }}
/>
```

### Different Sizes
```tsx
// Small (16px)
<SvgIcon name="check" width="16" height="16" />

// Medium (24px)
<SvgIcon name="check" width="24" height="24" />

// Large (48px)
<SvgIcon name="check" width="48" height="48" />
```

## 🔧 Advanced Usage

### Using the Context Hook
```tsx
import { useSvgSprite } from 'components/atoms/svg-sprite-loader';

function MyComponent() {
  const { isLoaded, isLoading, error, loadSprite } = useSvgSprite();
  
  if (isLoading) return <div>Loading sprites...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!isLoaded) return <div>Sprites not loaded</div>;
  
  return <div>Sprites are ready!</div>;
}
```

### Loading Multiple Sprites
```tsx
<SvgSpriteLoader url={mainSprite} version="1.0.0">
  <SvgSpriteLoader url={additionalSprite} version="1.0.0">
    {/* Your app content */}
  </SvgSpriteLoader>
</SvgSpriteLoader>
```

### Custom Cache Management
```tsx
import { clearCachedSvgSprite } from 'utils/svgSpriteUtils';

// Clear cache for a specific sprite
clearCachedSvgSprite('https://example.com/sprites.svg');
```

## 📊 Performance Features

### Automatic Caching
- Icons are cached in localStorage
- 30-day cache expiry
- Version-based cache invalidation
- Automatic cache cleanup

### Loading States
- Skeleton loading animation
- Error fallbacks
- Graceful degradation

### Optimization Tips
1. Use consistent viewBox dimensions
2. Optimize SVG paths
3. Remove unnecessary attributes
4. Consider sprite splitting for large icon sets

## 🐛 Troubleshooting

### Icons Not Showing
1. Check browser console for errors
2. Verify icon name matches symbol id
3. Ensure viewBox is correct
4. Check if sprite is loaded

### Styling Issues
1. Verify CSS classes are applied
2. Check for conflicting styles
3. Ensure proper fill/stroke attributes
4. Test with different color values

### Performance Issues
1. Optimize SVG code
2. Reduce number of icons in sprite
3. Consider lazy loading
4. Monitor bundle size

## 📱 Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 🎯 Best Practices

### Icon Design
- Use 24x24 viewBox for consistency
- Keep stroke width at 2px for line icons
- Use 1.5px stroke width for smaller details
- Maintain 2px padding from edges

### Code Organization
- Group related icons together
- Use descriptive names
- Maintain alphabetical order
- Add comments for categories

### Performance
- Optimize SVG files
- Use appropriate cache settings
- Monitor bundle size
- Consider preloading critical icons

## 🔍 Understanding the Generator Script

The `generate-svg-sprite.js` script is a development utility that automates sprite generation:

### What It Does:
1. **Scans** a directory for `.svg` files
2. **Extracts** viewBox and content from each SVG
3. **Converts** each file into a `<symbol>` element
4. **Generates** unique IDs from filenames (kebab-case)
5. **Combines** all symbols into a single sprite file
6. **Outputs** a ready-to-use sprite file

### When to Use It:
- ✅ Adding multiple icons at once
- ✅ Batch processing icon updates
- ✅ Maintaining consistent sprite structure
- ✅ Automating icon workflow

### When NOT to Use It:
- ❌ Adding a single icon (manual is faster)
- ❌ Need custom symbol IDs
- ❌ Complex icon modifications

### Script Location:
- **File**: `scripts/generate-svg-sprite.js`
- **NPM Script**: `npm run generate-sprite`
- **Default Input**: `icons/` directory
- **Default Output**: `public/sprites/app-icons.svg`

## 📖 Additional Resources

- [SVG Sprite System Documentation](./src/components/atoms/svg-sprite-loader/README.md)
- [Usage Examples](./src/components/examples/SvgSpriteUsageExample.tsx)
- [Generator Script Source](./scripts/generate-svg-sprite.js)
- [MDN SVG Documentation](https://developer.mozilla.org/en-US/docs/Web/SVG)
- [SVG Optimization Guide](https://css-tricks.com/understanding-and-manually-improving-svg-optimization/)

## 🚀 Quick Reference

### Adding Icons Workflow

**Option A: Using Generator (Multiple Icons)**
```bash
# 1. Create icons directory
mkdir icons

# 2. Add SVG files
# icons/home.svg, icons/user.svg, etc.

# 3. Generate sprite
npm run generate-sprite

# 4. Update version in app.tsx
# version="1.0.1"
```

**Option B: Manual (Single Icon)**
```bash
# 1. Edit public/sprites/app-icons.svg
# 2. Add <symbol> element
# 3. Update version in app.tsx
```

### Using Icons in Components
```tsx
import { SvgIcon } from 'components/atoms/svg-sprite-loader';

<SvgIcon 
  name="home"           // Must match symbol id in the sprite
  width="24" 
  height="24"
  className="text-blue-600"
/>
```

## 📝 Important Notes

- **Sprite Location**: `public/sprites/app-icons.svg` (served at `/sprites/app-icons.svg`)
- **Version Management**: Always increment the `version` prop in `SvgSpriteLoader` when updating icons to invalidate browser cache
- **Icon Naming**: Use kebab-case for icon IDs (e.g., `my-icon`, not `myIcon`)
- **Color**: Use `currentColor` in SVG to allow CSS color inheritance
- **Generator Script**: Not automatically run - use manually when needed

## 🎯 Best Practices Summary

1. **Consistency**: Use 24x24 viewBox for all icons
2. **Naming**: Use descriptive, kebab-case IDs
3. **Organization**: Group related icons together in the sprite file
4. **Optimization**: Remove unnecessary attributes from SVG code
5. **Versioning**: Update version number when modifying sprites
6. **Testing**: Verify icons display correctly after adding/modifying

The SVG sprite system is now fully integrated and ready for production use! 🎉
