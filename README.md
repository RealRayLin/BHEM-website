# BHEM Website v0 Setup Report | Rapport de Configuration du Site Web BHEM v0 | BHEM官网v0版本搭建报告

---

## 🇺🇸 English Version

## Usage

1. **Start Development Server**
   ```bash
   npm run dev
   ```

2. **Access Website**
   Open your browser and visit: http://localhost:3000

3. **Operation Instructions**
   - Desktop: Use mouse wheel or keyboard arrow keys to navigate pages
   - Mobile: Swipe screen to navigate, portrait mode will prompt to rotate to landscape
   - Right navigation dots: Click to quickly jump to specific pages
   - **Text Operations**: Select and copy text from PDF content
   - **Link Clicking**: PDF links are fully functional

## Important Notes

⚠️ **Hydration Warning Handling**: If you see hydration warnings in the browser console, these are typically caused by browser extensions and won't affect website functionality. We've added `suppressHydrationWarning` to handle this issue.

## Project Features

### Core Functionality
- ✅ Next.js 15 + TypeScript + Tailwind CSS
- ✅ FullscreenPDFViewer with advanced navigation system
- ✅ React-PDF direct display of PDF page content
- ✅ **Web Page Insertion System** - Insert interactive web pages between PDF pages
- ✅ **Dynamic Capsule System** - Smart floating navigation with content-aware sizing
- ✅ **TypeScript Configuration Management** - Flexible and type-safe insertion configuration
- ✅ Responsive design - Desktop enforced 16:9 ratio
- ✅ Mobile intelligent detection and landscape preview adaptation
- ✅ Complete BHEM brand color scheme implementation
- ✅ PDF text selection and copy functionality
- ✅ PDF link and annotation interaction support

### Technical Architecture
- **Frontend Framework**: Next.js 15 (App Router)
- **Type System**: TypeScript
- **Styling System**: Tailwind CSS + Custom CSS Variables
- **PDF Rendering**: react-pdf + pdfjs-dist
- **Web Page Insertion**: iframe-based with intelligent positioning
- **Configuration System**: TypeScript-based with validation and helper functions
- **Dynamic UI**: Content-aware capsule sizing and positioning
- **Responsive**: CSS Media Queries + JavaScript Detection

### Brand Color Scheme
- **Primary Colors**: 
  - Orange #F77C3B
  - Tomato Red #D44C2F 
  - Light Beige #E9E2C5
  - Bright Yellow Ochre #E6AC40
- **Secondary Colors**:
  - Deep Brown #693018
  - Vibrant Orange #FA9A4C
  - Warm Yellow Brown #DB9242
  - Deep Brick Red #B33B24
- **Neutral Colors**:
  - Cream White #F3ECD5
  - Deep Cocoa #44200F

## File Structure

```
BHEMwebsite/
├── src/
│   └── app/
│       ├── components/
│       │   ├── FullscreenPDFViewer.tsx     # Enhanced PDF viewer with web insertion
│       │   ├── LoadingSpinner.tsx          # Loading component
│       │   └── YoutubePlaylistViewer.tsx   # YouTube playlist component
│       ├── config/
│       │   └── webPageInsertions.ts        # Web page insertion configuration
│       ├── globals.css                      # Global styles and brand colors
│       ├── layout.tsx                       # Root layout
│       ├── page.tsx                         # Homepage
│       └── sitemap.ts                       # Sitemap configuration
├── public/
│   └── BHEM Brand Deck-Website.pdf         # PDF file
├── package.json                             # Dependencies configuration
├── vercel.json                              # Vercel deployment configuration
└── README.md                                # This documentation

```

## Responsive Design Details

### Desktop (≥768px)
- Enforced 16:9 aspect ratio display
- Content centered with black background filling empty space
- Maximizes screen space while maintaining proportions

### Mobile (<768px)
- **Portrait Mode**: Shows rotation prompt, suggests landscape viewing
- **Landscape Mode**: Auto-adapts to 16:9 ratio, maximizes PDF content display
- **Notch Adaptation**: Auto-detects notch position, navigation indicators intelligently avoid notch areas
- **Safe Area Support**: Full support for iOS and Android safe areas
- Touch swipe navigation support

## Known Features

### PDF & Navigation
1. **PDF Auto-pagination**: System automatically detects PDF page count and creates navigation for each page
2. **Enhanced Navigation**: Smart floating capsules with content-aware sizing
3. **Keyboard Support**: Arrow key navigation with smooth transitions
4. **Touch Support**: Mobile swipe navigation with gesture recognition
5. **Text Interaction**: Support for selecting and copying PDF text content
6. **Link Support**: PDF hyperlinks function normally

### Web Page Insertion System
7. **Dynamic Web Content**: Insert interactive web pages (YouTube, maps, etc.) between PDF pages
8. **Flexible Configuration**: TypeScript-based configuration with validation
9. **Smart Capsule System**: 
   - Dynamic sizing based on content length
   - Multi-line title support (1-n lines)
   - Intelligent positioning with proper spacing
10. **Full Viewport Display**: Web pages render in full-screen iframe with proper embedding

### Advanced Features
11. **Capsule Appearance Logic**: Smart timing based on PDF progress, not sequence numbers
12. **Content-Aware UI**: Capsule sizes adapt to actual text content
13. **Smooth Transitions**: 0.3s animated transitions between states
14. **Loading States**: Loading prompt during PDF loading with progress indication
15. **Error Handling**: Comprehensive error handling for PDF and web content loading
16. **Mobile Adaptation**: Responsive design with intelligent notch avoidance

## Development Environment

- Node.js environment
- NPM package manager
- Modern browser support

## Configuration Examples

### Web Page Insertion Configuration

```typescript
// src/app/config/webPageInsertions.ts
export const webPageInsertions: WebPageInsertion[] = [
  {
    id: "emancipation-playlist",
    location: [1, 2], // Insert between PDF page 1 and 2
    url: "https://www.youtube.com/embed/videoseries?list=PLUVpFBRxKq4N5LUQ0nJY1u8PZ22M2EzE4",
    title: [
      "Journeying to Emancipation",
      "Friday, August 1, 2025"
    ],
    enabled: true
  },
  {
    id: "single-line-example", 
    location: [5, 6],
    url: "https://www.youtube.com/embed/VIDEO_ID",
    title: "Single Line Title",
    enabled: true
  }
];
```

### Vercel Deployment Configuration

```json
// vercel.json
{
  "git": {
    "deploymentEnabled": {
      "main": true
    }
  }
}
```

## Next Steps for Improvement

1. **Enhanced Web Integration**: Add more interactive web content types
2. **Advanced Analytics**: Track user engagement with web insertions
3. **CMS Integration**: Content management system for easy updates
4. **SEO Optimization**: Meta tags and structured data for web pages
5. **Performance**: Optimize iframe loading and caching strategies
6. **Accessibility**: Enhanced keyboard navigation and screen reader support

---

## 🇫🇷 Version Française

## Utilisation

1. **Démarrer le Serveur de Développement**
   ```bash
   npm run dev
   ```

2. **Accéder au Site Web**
   Ouvrez votre navigateur et visitez : http://localhost:3000

3. **Instructions d'Utilisation**
   - Bureau : Utilisez la molette de la souris ou les touches fléchées du clavier pour naviguer
   - Mobile : Balayez l'écran pour naviguer, le mode portrait vous invitera à passer en paysage
   - Points de navigation à droite : Cliquez pour aller rapidement à des pages spécifiques
   - **Opérations Texte** : Sélectionnez et copiez le texte du contenu PDF
   - **Clic sur les Liens** : Les liens PDF sont entièrement fonctionnels

## Notes Importantes

⚠️ **Gestion des Avertissements d'Hydratation** : Si vous voyez des avertissements d'hydratation dans la console du navigateur, ils sont généralement causés par les extensions de navigateur et n'affecteront pas la fonctionnalité du site web. Nous avons ajouté `suppressHydrationWarning` pour gérer ce problème.

## Caractéristiques du Projet

### Fonctionnalités Principales
- ✅ Next.js 15 + TypeScript + Tailwind CSS
- ✅ FullscreenPDFViewer avec système de navigation avancé
- ✅ Affichage direct du contenu des pages PDF avec React-PDF
- ✅ **Système d'Insertion de Pages Web** - Insérer des pages web interactives entre les pages PDF
- ✅ **Système de Capsules Dynamiques** - Navigation flottante intelligente avec dimensionnement adaptatif
- ✅ **Gestion de Configuration TypeScript** - Configuration d'insertion flexible et type-safe
- ✅ Design responsive - Ratio 16:9 forcé sur bureau
- ✅ Détection intelligente mobile et adaptation à l'aperçu paysage
- ✅ Implémentation complète du schéma de couleurs de marque BHEM
- ✅ Fonctionnalité de sélection et copie de texte PDF
- ✅ Support d'interaction des liens et annotations PDF

### Architecture Technique
- **Framework Frontend** : Next.js 15 (App Router)
- **Système de Types** : TypeScript
- **Système de Styles** : Tailwind CSS + Variables CSS Personnalisées
- **Bibliothèque de Transition de Pages** : @fullpage/react-fullpage
- **Rendu PDF** : react-pdf + pdfjs-dist
- **Responsive** : Requêtes Média CSS + Détection JavaScript

### Schéma de Couleurs de Marque
- **Couleurs Primaires** : 
  - Orange #F77C3B
  - Rouge Tomate #D44C2F 
  - Beige Clair #E9E2C5
  - Ocre Jaune Vif #E6AC40
- **Couleurs Secondaires** :
  - Brun Profond #693018
  - Orange Vibrant #FA9A4C
  - Brun Jaune Chaud #DB9242
  - Rouge Brique Profond #B33B24
- **Couleurs Neutres** :
  - Blanc Crème #F3ECD5
  - Cacao Profond #44200F

## Structure des Fichiers

```
BHEMwebsite/
├── src/
│   └── app/
│       ├── components/
│       │   └── FullPagePDFViewer.tsx    # Composant principal de visualisation PDF
│       ├── globals.css                   # Styles globaux et couleurs de marque
│       ├── layout.tsx                    # Mise en page racine
│       └── page.tsx                      # Page d'accueil
├── public/
│   └── BHEM Brand Deck-v2-Website.pdf # Fichier PDF
├── package.json                          # Configuration des dépendances
├── verify.sh                            # Script de vérification
└── 0-AIGcode/
    └── report/
        └── BHEMwebsite-setup-report.md   # Ce rapport

```

## Détails du Design Responsive

### Bureau (≥768px)
- Affichage avec ratio d'aspect 16:9 forcé
- Contenu centré avec arrière-plan noir remplissant l'espace vide
- Maximise l'espace d'écran tout en maintenant les proportions

### Mobile (<768px)
- **Mode Portrait** : Affiche une invite de rotation, suggère la visualisation en paysage
- **Mode Paysage** : S'adapte automatiquement au ratio 16:9, maximise l'affichage du contenu PDF
- **Adaptation Encoche** : Détecte automatiquement la position de l'encoche, les indicateurs de navigation évitent intelligemment les zones d'encoche
- **Support Zone Sûre** : Support complet pour les zones sûres iOS et Android
- Support de navigation par balayage tactile

## Fonctionnalités Connues

1. **Pagination PDF Automatique** : Le système détecte automatiquement le nombre de pages PDF et crée des sections fullPage pour chaque page
2. **Affichage Numéro de Page** : Page actuelle/pages totales affichées en bas à droite
3. **Système de Navigation** : Navigation par points à droite avec support de saut rapide
4. **Support Clavier** : Navigation par touches fléchées
5. **Support Tactile** : Navigation par balayage mobile
6. **Interaction Texte** : Support pour sélectionner et copier le contenu texte PDF
7. **Support Liens** : Les hyperliens PDF fonctionnent normalement
8. **Adaptation Écran à Encoche** : Détecte automatiquement et évite les encoches d'appareil, ajuste intelligemment la position de navigation
9. **États de Chargement** : Invite de chargement pendant le chargement PDF
10. **Gestion d'Erreurs** : Messages d'erreur lorsque le chargement PDF échoue

## Environnement de Développement

- Environnement Node.js
- Gestionnaire de paquets NPM
- Support de navigateurs modernes

## Prochaines Étapes d'Amélioration

1. Remplacer par des pages HTML personnalisées basées sur le contenu PDF réel
2. Ajouter des effets d'animation de transition de page
3. Intégrer un système CMS pour une gestion de contenu plus facile
4. Ajouter l'optimisation SEO
5. Optimisation des performances (chargement paresseux d'images, etc.)

---

## 🇨🇳 简体中文版本

## 使用方法

1. **启动开发服务器**
   ```bash
   npm run dev
   ```

2. **访问网站**
   打开浏览器访问: http://localhost:3000

3. **操作说明**
   - 桌面端：使用鼠标滚轮或键盘方向键翻页
   - 移动端：滑动屏幕翻页，竖屏时会提示横屏观看
   - 右侧导航点：点击快速跳转到指定页面
   - **文本操作**：可以选中PDF中的文字进行复制等操作
   - **链接点击**：PDF中的链接可以正常点击

## 重要说明

⚠️ **水合警告处理**: 如果在浏览器控制台看到水合警告，这通常是由浏览器扩展引起的，不会影响网站功能。我们已经添加了`suppressHydrationWarning`来处理这个问题。

## 项目特性

### 核心功能
- ✅ Next.js 15 + TypeScript + Tailwind CSS
- ✅ FullscreenPDFViewer 高级导航系统
- ✅ React-PDF 直接显示PDF各页内容
- ✅ **网页插入系统** - 在PDF页面间插入交互式网页内容
- ✅ **动态胶囊系统** - 智能浮动导航，内容感知尺寸调整
- ✅ **TypeScript配置管理** - 灵活且类型安全的插入配置
- ✅ 响应式设计 - 桌面端强制16:9比例
- ✅ 移动端智能检测并适配横屏预览
- ✅ BHEM品牌色彩方案完整应用
- ✅ PDF文本选择和复制功能
- ✅ PDF链接和注释交互支持

### 技术架构
- **前端框架**: Next.js 15 (App Router)
- **类型系统**: TypeScript
- **样式系统**: Tailwind CSS + Custom CSS Variables
- **翻页库**: @fullpage/react-fullpage
- **PDF渲染**: react-pdf + pdfjs-dist
- **响应式**: CSS媒体查询 + JavaScript检测

### 品牌色彩方案
- **主色调**: 
  - 橘色 #F77C3B
  - 番茄红 #D44C2F 
  - 浅米色 #E9E2C5
  - 亮黄赭 #E6AC40
- **辅助色**:
  - 深棕 #693018
  - 活力橙 #FA9A4C
  - 暖黄棕 #DB9242
  - 深砖红 #B33B24
- **中性色**:
  - 奶油白 #F3ECD5
  - 深可可 #44200F

## 文件结构

```
BHEMwebsite/
├── src/
│   └── app/
│       ├── components/
│       │   └── FullPagePDFViewer.tsx    # 主PDF查看器组件
│       ├── globals.css                   # 全局样式和品牌色彩
│       ├── layout.tsx                    # 根布局
│       └── page.tsx                      # 首页
├── public/
│   └── BHEM Brand Deck-v2-Website.pdf # PDF文件
├── package.json                          # 依赖配置
├── verify.sh                            # 验证脚本
└── 0-AIGcode/
    └── report/
        └── BHEMwebsite-setup-report.md   # 本报告

```

## 响应式设计详细说明

### 桌面端 (≥768px)
- 强制16:9宽高比显示
- 内容居中，黑色背景填充空余空间
- 最大化利用屏幕空间同时保持比例

### 移动端 (<768px)
- **竖屏模式**: 显示旋转提示，建议横屏观看
- **横屏模式**: 自动适配16:9比例，最大化显示PDF内容
- **刘海适配**: 自动检测刘海位置，翻页指示器智能避开刘海区域
- **Safe Area支持**: 完全支持iOS和Android的安全区域
- 触摸滑动翻页支持

## 已知功能

1. **PDF自动分页**: 系统自动检测PDF页数并为每页创建fullPage section
2. **页码显示**: 右下角显示当前页码/总页数
3. **导航系统**: 右侧圆点导航，支持快速跳转
4. **键盘支持**: 方向键翻页
5. **触摸支持**: 移动端滑动翻页
6. **文本交互**: 支持选择、复制PDF中的文本内容
7. **链接支持**: PDF中的超链接可正常点击
8. **刘海屏适配**: 自动检测并避开设备刘海，智能调整导航位置
9. **加载状态**: PDF加载时显示Loading提示
10. **错误处理**: PDF加载失败时显示错误信息

## 开发环境

- Node.js 环境
- NPM包管理器
- 现代浏览器支持

## 下一步改进建议

1. 可根据PDF实际内容替换为自定义HTML页面
2. 添加页面切换动画效果
3. 集成CMS系统便于内容管理
4. 添加SEO优化
5. 性能优化 (图片懒加载等)

---

**Generated Time | Temps de Génération | 生成时间**: January 2025 | Janvier 2025 | 2025年1月