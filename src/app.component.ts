import { Component, ElementRef, ViewChild, signal, effect, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RandomizerService } from './services/randomizer.service';
import { GeminiService } from './services/gemini.service';

interface TextLayer {
  id: 'name' | 'id';
  text: string;
  x: number; // Percentage 0-1
  y: number; // Percentage 0-1
  isDragging: boolean;
}

interface PortraitLayer {
  image: HTMLImageElement | null;
  x: number;
  y: number;
  width: number; // Percentage of canvas width
  height: number; // Calculated based on aspect ratio
  rotation: number; // Degrees
  isDragging: boolean;
}

@Component({
  selector: 'app-root',
  imports: [CommonModule],
  templateUrl: './app.component.html'
})
export class AppComponent implements AfterViewInit {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  // ---------------------------------------------------------
  // 👇👇👇 ZONE DE CONFIGURATION IMAGE 👇👇👇
  readonly CUSTOM_BASE_IMAGE: string = 'https://raw.githubusercontent.com/nathanhai78-rgb/image/refs/heads/main/MIKE%20LE%20GRAND.png'; 
  // ---------------------------------------------------------

  // Signals for State
  imageLoaded = signal<boolean>(false);
  isAnalyzing = signal<boolean>(false);
  isGeneratingPortrait = signal<boolean>(false);
  
  // Data State
  nameText = signal<string>('JEAN DUPONT');
  idText = signal<string>('12345678-A');
  textColor = signal<string>('#000000');
  fontSize = signal<number>(15); // Valeur par défaut modifiée à 15
  rotation = signal<number>(6);  // Valeur par défaut modifiée à 6
  
  // Portrait State
  portraitScale = signal<number>(25);
  portraitRotation = signal<number>(0);

  // Position Display Signals (pour affichage UI)
  // Mises à jour avec les nouvelles valeurs par défaut
  nameCoords = signal<{x: number, y: number}>({x: 51, y: 44});
  idCoords = signal<{x: number, y: number}>({x: 52, y: 51});

  // Canvas State
  private ctx: CanvasRenderingContext2D | null = null;
  private baseImage: HTMLImageElement | null = null;
  
  // Layers State
  // Mises à jour avec les nouvelles valeurs par défaut (0.51, 0.44 etc.)
  private nameLayer: TextLayer = { id: 'name', text: '', x: 0.51, y: 0.44, isDragging: false };
  private idLayer: TextLayer = { id: 'id', text: '', x: 0.52, y: 0.52, isDragging: false };
  private portraitLayer: PortraitLayer = { 
    image: null, 
    x: 0.1, 
    y: 0.35, 
    width: 0.25, 
    height: 0, 
    rotation: 0,
    isDragging: false 
  };

  // Dragging logic
  private dragStart: { x: number, y: number } | null = null;
  private activeLayer: 'name' | 'id' | 'portrait' | null = null;

  constructor(
    private randomizer: RandomizerService,
    private gemini: GeminiService
  ) {
    // Initial random data
    this.randomizeData();
    
    // Redraw effect when signals change
    effect(() => {
      // Track signals
      const n = this.nameText();
      const i = this.idText();
      const c = this.textColor();
      const s = this.fontSize();
      const r = this.rotation();
      const ps = this.portraitScale();
      const pr = this.portraitRotation();
      
      this.nameLayer.text = n;
      this.idLayer.text = i;
      
      // Update portrait properties from signals
      this.portraitLayer.width = ps / 100;
      this.portraitLayer.rotation = pr;
      
      this.draw();
    });
  }

  ngAfterViewInit() {
    if (this.CUSTOM_BASE_IMAGE && this.CUSTOM_BASE_IMAGE.length > 5) {
      setTimeout(() => {
        this.loadDemoImage();
      }, 100);
    }
  }

  randomizeData() {
    this.nameText.set(this.randomizer.getRandomName().toUpperCase());
    this.idText.set(this.randomizer.getRandomId());
  }

  // --- File Handling ---

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.loadFile(input.files[0]);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
      this.loadFile(event.dataTransfer.files[0]);
    }
  }

  loadFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        this.baseImage = img;
        this.imageLoaded.set(true);
        // Reset positions to defaults if new image
        this.nameLayer.x = 0.51; this.nameLayer.y = 0.44;
        this.idLayer.x = 0.52; this.idLayer.y = 0.52;
        this.updateCoordsDisplay();
        
        setTimeout(() => this.initCanvas(), 0);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  loadDemoImage() {
    if (this.CUSTOM_BASE_IMAGE.length > 5) {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        this.baseImage = img;
        this.imageLoaded.set(true);
        setTimeout(() => this.initCanvas(), 0);
      };
      img.onerror = () => {
        console.error('Failed to load custom base image. Using generator.');
        this.generateDemoCanvas();
      }
      img.src = this.CUSTOM_BASE_IMAGE;
    } else {
      this.generateDemoCanvas();
    }
  }

  generateDemoCanvas() {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 500;
    const ctx = canvas.getContext('2d')!;
    
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(0, 0, 800, 500);
    
    ctx.fillStyle = '#0f766e';
    ctx.fillRect(0, 0, 800, 80);
    ctx.fillStyle = 'white';
    ctx.font = 'bold 30px Inter';
    ctx.fillText('RÉPUBLIQUE IMAGINAIRE', 40, 50);

    ctx.fillStyle = '#334155';
    ctx.font = 'bold 20px Inter';
    ctx.fillText('Nom :', 300, 200);
    ctx.fillText('ID Number :', 300, 280);
    
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    ctx.strokeRect(50, 150, 200, 250);
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(50, 150, 200, 250);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '20px Inter';
    ctx.fillText('PHOTO', 110, 280);

    const img = new Image();
    img.onload = () => {
      this.baseImage = img;
      this.imageLoaded.set(true);
      setTimeout(() => this.initCanvas(), 0);
    };
    img.src = canvas.toDataURL();
  }

  initCanvas() {
    if (!this.canvasRef || !this.baseImage) return;
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d');
    canvas.width = this.baseImage.width;
    canvas.height = this.baseImage.height;
    this.draw();
  }

  draw() {
    if (!this.ctx || !this.baseImage || !this.canvasRef) return;
    
    const w = this.canvasRef.nativeElement.width;
    const h = this.canvasRef.nativeElement.height;
    
    this.ctx.clearRect(0, 0, w, h);
    this.ctx.drawImage(this.baseImage, 0, 0, w, h);

    if (this.portraitLayer.image) {
       const pw = this.portraitLayer.width * w;
       const ph = (pw / this.portraitLayer.image.width) * this.portraitLayer.image.height;
       const px = this.portraitLayer.x * w;
       const py = this.portraitLayer.y * h;
       this.portraitLayer.height = ph / h;

       this.ctx.save();
       this.ctx.translate(px + pw/2, py + ph/2);
       this.ctx.rotate(this.portraitLayer.rotation * Math.PI / 180);
       this.ctx.drawImage(this.portraitLayer.image, -pw/2, -ph/2, pw, ph);
       
       if (this.portraitLayer.isDragging) {
         this.ctx.strokeStyle = '#10b981';
         this.ctx.lineWidth = 4;
         this.ctx.strokeRect(-pw/2, -ph/2, pw, ph);
         this.ctx.fillStyle = '#10b981';
         const s = 10;
         this.ctx.fillRect(-pw/2 - s/2, -ph/2 - s/2, s, s);
         this.ctx.fillRect(pw/2 - s/2, ph/2 - s/2, s, s);
       }
       this.ctx.restore();
    }

    this.ctx.fillStyle = this.textColor();
    const scaleFactor = w / 800; 
    const fontSize = this.fontSize() * scaleFactor;
    this.ctx.font = `bold ${fontSize}px "Courier Prime", monospace`;
    this.ctx.textBaseline = 'top';

    [this.nameLayer, this.idLayer].forEach(layer => {
      this.ctx!.save();
      const x = layer.x * w;
      const y = layer.y * h;
      
      this.ctx!.translate(x, y);
      this.ctx!.rotate(this.rotation() * Math.PI / 180);
      this.ctx!.fillText(layer.text, 0, 0);
      
      if (layer.isDragging) {
        const metrics = this.ctx!.measureText(layer.text);
        const height = fontSize * 1.2;
        this.ctx!.strokeStyle = '#10b981';
        this.ctx!.lineWidth = 2;
        this.ctx!.strokeRect(-5, -5, metrics.width + 10, height + 10);
      }
      this.ctx!.restore();
    });
  }

  // --- Interaction ---

  getMousePos(event: MouseEvent) {
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    const scaleX = this.canvasRef.nativeElement.width / rect.width;
    const scaleY = this.canvasRef.nativeElement.height / rect.height;
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY
    };
  }

  isHit(layer: TextLayer, mx: number, my: number): boolean {
    if (!this.ctx) return false;
    const w = this.canvasRef.nativeElement.width;
    const h = this.canvasRef.nativeElement.height;
    const x = layer.x * w;
    const y = layer.y * h;
    const scaleFactor = w / 800; 
    const fontSize = this.fontSize() * scaleFactor;
    this.ctx.font = `bold ${fontSize}px "Courier Prime", monospace`;
    const metrics = this.ctx.measureText(layer.text);
    return (mx >= x && mx <= x + metrics.width && my >= y && my <= y + fontSize);
  }

  isPortraitHit(mx: number, my: number): boolean {
    if (!this.portraitLayer.image) return false;
    const w = this.canvasRef.nativeElement.width;
    const h = this.canvasRef.nativeElement.height;
    const pw = this.portraitLayer.width * w;
    const ph = this.portraitLayer.height * h;
    const px = this.portraitLayer.x * w;
    const py = this.portraitLayer.y * h;
    const cx = px + pw/2;
    const cy = py + ph/2;
    const dx = mx - cx;
    const dy = my - cy;
    const ang = -this.portraitLayer.rotation * Math.PI / 180;
    const rx = dx * Math.cos(ang) - dy * Math.sin(ang);
    const ry = dx * Math.sin(ang) + dy * Math.cos(ang);
    return (rx >= -pw/2 && rx <= pw/2 && ry >= -ph/2 && ry <= ph/2);
  }

  onMouseDown(event: MouseEvent) {
    if (!this.imageLoaded()) return;
    const pos = this.getMousePos(event);
    
    if (this.isHit(this.nameLayer, pos.x, pos.y)) {
      this.activeLayer = 'name';
      this.nameLayer.isDragging = true;
    } else if (this.isHit(this.idLayer, pos.x, pos.y)) {
      this.activeLayer = 'id';
      this.idLayer.isDragging = true;
    } else if (this.isPortraitHit(pos.x, pos.y)) {
      this.activeLayer = 'portrait';
      this.portraitLayer.isDragging = true;
    }

    if (this.activeLayer) {
      this.dragStart = pos;
      this.draw();
    }
  }

  updateLayerPos(event: MouseEvent) {
     if (!this.activeLayer || !this.dragStart) return;
     const pos = this.getMousePos(event);
     const dx = pos.x - this.dragStart.x;
     const dy = pos.y - this.dragStart.y;
     const w = this.canvasRef.nativeElement.width;
     const h = this.canvasRef.nativeElement.height;

     if (this.activeLayer === 'name') {
       this.nameLayer.x += dx / w;
       this.nameLayer.y += dy / h;
     } else if (this.activeLayer === 'id') {
       this.idLayer.x += dx / w;
       this.idLayer.y += dy / h;
     } else if (this.activeLayer === 'portrait') {
       this.portraitLayer.x += dx / w;
       this.portraitLayer.y += dy / h;
     }

     this.updateCoordsDisplay();
     this.dragStart = pos;
     this.draw();
  }

  updateCoordsDisplay() {
    this.nameCoords.set({
      x: Math.round(this.nameLayer.x * 100), 
      y: Math.round(this.nameLayer.y * 100)
    });
    this.idCoords.set({
      x: Math.round(this.idLayer.x * 100), 
      y: Math.round(this.idLayer.y * 100)
    });
  }

  // --- AI Features ---

  async analyzeLayout() {
    if (!this.baseImage) return;
    this.isAnalyzing.set(true);
    
    try {
      const canvas = this.canvasRef.nativeElement;
      const base64 = canvas.toDataURL('image/jpeg', 0.8);
      const result = await this.gemini.analyzeLayout(base64);
      
      if (result) {
        if (result.namePosition) {
          this.nameLayer.x = result.namePosition.x / 100;
          this.nameLayer.y = result.namePosition.y / 100;
        }
        if (result.idPosition) {
          this.idLayer.x = result.idPosition.x / 100;
          this.idLayer.y = result.idPosition.y / 100;
        }
        this.updateCoordsDisplay();
        this.draw();
      }
    } catch (e) {
      console.error(e);
      alert('Erreur lors de l\'analyse IA. Vérifiez votre clé API.');
    } finally {
      this.isAnalyzing.set(false);
    }
  }

  async generatePortrait() {
    this.isGeneratingPortrait.set(true);
    try {
      const prompt = `A professional ID card portrait photo of a person named ${this.nameText()}, neutral background, realistic, passport style, high quality, facing camera.`;
      const base64Data = await this.gemini.generatePortrait(prompt);
      const img = new Image();
      img.onload = () => {
        this.portraitLayer.image = img;
        this.draw();
        this.isGeneratingPortrait.set(false);
      };
      img.src = base64Data;
    } catch (e) {
      console.error(e);
      this.isGeneratingPortrait.set(false);
      alert('Erreur de génération d\'image.');
    }
  }

  // --- Updates ---
  updateName(e: Event) { this.nameText.set((e.target as HTMLInputElement).value); }
  updateId(e: Event) { this.idText.set((e.target as HTMLInputElement).value); }
  updateColor(e: Event) { this.textColor.set((e.target as HTMLInputElement).value); }
  updateFontSize(e: Event) { this.fontSize.set(Number((e.target as HTMLInputElement).value)); }
  updateRotation(e: Event) { this.rotation.set(Number((e.target as HTMLInputElement).value)); }
  
  updatePortraitScale(e: Event) { this.portraitScale.set(Number((e.target as HTMLInputElement).value)); }
  updatePortraitRotation(e: Event) { this.portraitRotation.set(Number((e.target as HTMLInputElement).value)); }

  onMouseUp() {
    if (this.activeLayer) {
      if (this.activeLayer === 'name') this.nameLayer.isDragging = false;
      if (this.activeLayer === 'id') this.idLayer.isDragging = false;
      if (this.activeLayer === 'portrait') this.portraitLayer.isDragging = false;
      this.activeLayer = null;
      this.draw();
    }
  }

  downloadImage() {
    if (!this.canvasRef) return;
    const link = document.createElement('a');
    link.download = `id-card-${this.idText()}.png`;
    link.href = this.canvasRef.nativeElement.toDataURL();
    link.click();
  }
}