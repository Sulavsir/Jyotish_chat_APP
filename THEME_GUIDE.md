# Cosmic Jyotish Theme - Color Palette

## 🎨 Inspired by Margadarshan

This theme is inspired by the mystical cosmic aesthetic of the Margadarshan design, featuring deep purples, vibrant oranges, golds, and cosmic nebula effects.

## 🌌 Color System

### Background Colors

```css
/* Deep Purple/Indigo - Primary Background */
--bg-dark: #1a0a2e /* Main background - Deep Purple */ --bg-default: #2d1b4e
  /* Lighter background - Indigo */ --bg-base: #0f051d /* Very dark purple for depth */;
```

**Usage:** Use these for main backgrounds, cards, and containers.

### Primary Accent Colors

#### 🟠 Orange/Amber (Pillars & Main Accents)

```css
cosmic-orange-500: #ff8f00  /* Primary Orange */
cosmic-orange-600: #ff6f00  /* Bright Orange (borders/lines) */
cosmic-orange-400: #ffa726  /* Light Orange */
```

**Usage:** Primary action buttons, glowing effects, main accents, borders.

#### 🟡 Gold/Yellow (Text & Zodiac Wheel)

```css
cosmic-gold-500: #ffc107  /* Gold Text */
cosmic-gold-600: #ffb300  /* Bright Gold */
cosmic-gold-400: #ffee58  /* Light Gold */
```

**Usage:** Headlines, important text, zodiac symbols, highlights.

### Secondary Accent Colors

#### 🌸 Magenta/Pink (Nebula Effects)

```css
cosmic-magenta-500: #d81b60  /* Primary Magenta */
cosmic-magenta-600: #c2185b  /* Deep Magenta */
```

**Usage:** Secondary accents, nebula effects, hover states, feature cards.

#### 🔴 Deep Red (Nebula & Accent Areas)

```css
cosmic-red-500: #c62828  /* Deep Red */
cosmic-red-600: #b71c1c  /* Dark Red */
```

**Usage:** Error states, critical actions, atmospheric nebula effects.

#### 🔵 Electric Blue (Starfield)

```css
cosmic-blue-500: #2196f3  /* Electric Blue */
cosmic-blue-600: #1976d2  /* Deep Blue */
```

**Usage:** Links, interactive elements, starfield effects, info messages.

#### 💜 Cosmic Purple (Atmospheric Effects)

```css
cosmic-purple-500: #7b1fa2  /* Cosmic Purple */
cosmic-purple-600: #6a1b9a  /* Deep Purple */
```

**Usage:** Atmospheric effects, tertiary accents, mystical elements.

#### 🟤 Dark Brown/Maroon (Stage/Platform)

```css
cosmic-brown-500: #4e342e  /* Dark Brown */
cosmic-brown-600: #3e2723  /* Maroon */
```

**Usage:** Platform elements, grounding elements, footer backgrounds.

## 🎭 Component Usage Guide

### Hero Section

```tsx
<h1 className="text-cosmic-gold-500">  // Gold headline
<p className="text-cosmic-gold-300">   // Gold subtext
<Button className="bg-cosmic-orange-500 border-cosmic-orange-600">
```

### Cards

```tsx
<Card className="bg-cosmic-bg-DEFAULT/50 border-cosmic-orange-600/40
               hover:border-cosmic-orange-500/70
               shadow-[0_0_25px_rgba(255,143,0,0.3)]">
```

### Buttons

**Primary Button (Call-to-Action):**

```tsx
className="bg-cosmic-orange-500 hover:bg-cosmic-orange-600
           text-white border-2 border-cosmic-orange-600
           shadow-[0_0_30px_rgba(255,143,0,0.5)]"
```

**Secondary Button (Outline):**

```tsx
className="border-2 border-cosmic-gold-500 text-cosmic-gold-400
           hover:bg-cosmic-gold-500/20 hover:border-cosmic-gold-400"
```

### Feature Cards Color Scheme

- **Card 1:** Orange border (`cosmic-orange-600`)
- **Card 2:** Magenta border (`cosmic-magenta-600`)
- **Card 3:** Blue border (`cosmic-blue-600`)

### Step Indicators

- **Step 1:** Orange (`cosmic-orange-500`)
- **Step 2:** Magenta (`cosmic-magenta-500`)
- **Step 3:** Blue (`cosmic-blue-500`)
- **Step 4:** Purple (`cosmic-purple-500`)

## 🌟 Special Effects

### Glow Effects

```css
/* Orange Glow */
shadow-[0_0_30px_rgba(255,143,0,0.5)]

/* Gold Glow */
drop-shadow-[0_0_25px_rgba(255,193,7,0.6)]

/* Magenta Glow */
shadow-[0_0_35px_rgba(216,27,96,0.5)]

/* Blue Glow */
shadow-[0_0_35px_rgba(33,150,243,0.5)]
```

### Nebula Effects (Background)

- **Nebula 1:** Orange/Amber glow (top-left)
- **Nebula 2:** Magenta/Pink glow (bottom-right)
- **Nebula 3:** Deep Red glow (top-right center)
- **Nebula 4:** Cosmic Purple glow (bottom-left)

### Starfield

- **Small stars:** Gold and white tints
- **Medium stars:** Orange and blue tints
- **Large stars:** Orange, gold, and blue accents

## 🎨 CSS Variables (HSL Format)

### Light Mode

```css
--primary: 33 100% 50%; /* Orange #ff8f00 */
--secondary: 45 100% 66%; /* Gold #ffc107 */
--accent: 333 77% 48%; /* Magenta #d81b60 */
--destructive: 0 68% 45%; /* Red #c62828 */
```

### Dark Mode

```css
--background: 264 67% 12%; /* Deep purple #1a0a2e */
--foreground: 45 100% 65%; /* Gold text */
--primary: 33 100% 50%; /* Orange #ff8f00 */
--secondary: 45 100% 66%; /* Gold #ffc107 */
--accent: 333 77% 48%; /* Magenta #d81b60 */
--border: 33 100% 56%; /* Orange border #ff6f00 */
```

## 📦 Full Color Palette

### cosmic-orange (Warm Orange - Primary Accent)

| Shade   | Hex         | Usage                  |
| ------- | ----------- | ---------------------- |
| 50      | #fff3e0     | Very light backgrounds |
| 100     | #ffe0b2     | Light backgrounds      |
| 200     | #ffcc80     | Soft accents           |
| 300     | #ffb74d     | Muted accents          |
| 400     | #ffa726     | Light orange           |
| **500** | **#ff8f00** | **Primary orange**     |
| **600** | **#ff6f00** | **Borders/lines**      |
| 700     | #f57c00     | Dark orange            |
| 800     | #ef6c00     | Darker orange          |
| 900     | #e65100     | Darkest orange         |

### cosmic-gold (Golden Yellow - Text & Highlights)

| Shade   | Hex         | Usage           |
| ------- | ----------- | --------------- |
| 50      | #fffde7     | Very light text |
| 100     | #fff9c4     | Light text      |
| 200     | #fff59d     | Soft gold       |
| 300     | #fff176     | Muted gold      |
| 400     | #ffee58     | Light gold      |
| **500** | **#ffc107** | **Gold text**   |
| **600** | **#ffb300** | **Bright gold** |
| 700     | #ffa000     | Dark gold       |
| 800     | #ff8f00     | Darker gold     |
| 900     | #ff6f00     | Darkest gold    |

### cosmic-magenta (Pink/Magenta - Nebula)

| Shade   | Hex         | Usage               |
| ------- | ----------- | ------------------- |
| **500** | **#d81b60** | **Primary magenta** |
| **600** | **#c2185b** | **Deep magenta**    |

### cosmic-red (Deep Red - Accents)

| Shade   | Hex         | Usage        |
| ------- | ----------- | ------------ |
| **500** | **#c62828** | **Deep red** |
| **600** | **#b71c1c** | **Dark red** |

### cosmic-blue (Electric Blue - Interactive)

| Shade   | Hex         | Usage             |
| ------- | ----------- | ----------------- |
| **500** | **#2196f3** | **Electric blue** |
| **600** | **#1976d2** | **Deep blue**     |

### cosmic-purple (Cosmic Purple - Atmospheric)

| Shade   | Hex         | Usage             |
| ------- | ----------- | ----------------- |
| **500** | **#7b1fa2** | **Cosmic purple** |
| **600** | **#6a1b9a** | **Deep purple**   |

### cosmic-brown (Dark Brown/Maroon - Platform)

| Shade   | Hex         | Usage          |
| ------- | ----------- | -------------- |
| **500** | **#4e342e** | **Dark brown** |
| **600** | **#3e2723** | **Maroon**     |

## 🎯 Design Principles

1. **Background:** Always use deep purple (`#1a0a2e` or `#2d1b4e`)
2. **Primary Actions:** Use orange (`#ff8f00`) with glow effects
3. **Text:** Use gold (`#ffc107`) for headlines and important text
4. **Borders:** Use bright orange (`#ff6f00`) for emphasis
5. **Hover States:** Increase opacity and glow intensity
6. **Nebula Effects:** Use magenta, red, and purple for atmosphere
7. **Accessibility:** Maintain proper contrast ratios with dark backgrounds

## 🚀 Quick Examples

### Hero Button

```tsx
<button
  className="bg-cosmic-orange-500 hover:bg-cosmic-orange-600 
                   text-white font-bold border-2 border-cosmic-orange-600
                   shadow-[0_0_30px_rgba(255,143,0,0.5)] 
                   hover:shadow-[0_0_45px_rgba(255,111,0,0.7)]"
>
  Get Started
</button>
```

### Feature Card

```tsx
<div
  className="bg-cosmic-bg-DEFAULT/50 backdrop-blur-md 
                border-2 border-cosmic-orange-600/40 
                hover:border-cosmic-orange-500/70
                shadow-[0_0_25px_rgba(255,143,0,0.3)]"
>
  {/* Content */}
</div>
```

### Headline

```tsx
<h1
  className="text-cosmic-gold-500 
                drop-shadow-[0_0_50px_rgba(255,193,7,0.7)]"
>
  YOUR HEADLINE
</h1>
```

---

**Remember:** The key to this theme is the mystical cosmic atmosphere created by:

- Deep purple backgrounds
- Warm orange/gold accents
- Vibrant nebula effects (magenta, red, purple)
- Glowing elements
- Starfield with golden tints


