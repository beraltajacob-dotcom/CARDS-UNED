import { Component, ElementRef, signal, effect, viewChild, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RandomizerService } from './services/randomizer.service';

interface TextLayer {
  id: 'name' | 'id';
  text: string;
  x: number; // Percentage 0-1
  y: number; // Percentage 0-1
  isDragging: boolean;
}

@Component({
  selector: 'app-root',
  imports: [CommonModule],
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements OnInit {
  canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  fileInput = viewChild.required<ElementRef<HTMLInputElement>>('fileInput');

  // ---------------------------------------------------------
  // 👇👇👇 ZONE DE CONFIGURATION IMAGE 👇👇👇
  readonly CUSTOM_BASE_IMAGE: string = 'https://raw.githubusercontent.com/nathanhai78-rgb/image/refs/heads/main/MIKE%20LE%20GRAND.png'; 
  // ---------------------------------------------------------

  // Signals for State
  imageLoaded = signal<boolean>(false);
  isLoading = signal<boolean>(false);
  baseImage = signal<HTMLImageElement | null>(null);
  
  // Data State
  nameText = signal<string>('JEAN DUPONT');
  idText = signal<string>('12345678-A');
  textColor = signal<string>('#000000');
  fontSize = signal<number>(15);
  rotation = signal<number>(6);
  
  // Position Display Signals (pour affichage UI)
  nameCoords = signal<{x: number, y: number}>({x: 51, y: 44});
  idCoords = signal<{x: number, y: number}>({x: 54, y: 49});

  // Canvas State
  private ctx: CanvasRenderingContext2D | null = null;
  
  // Layers State
  private nameLayer: TextLayer = { id: 'name', text: '', x: 0.51, y: 0.44, isDragging: false };
  private idLayer: TextLayer = { id: 'id', text: '', x: 0.54, y: 0.49, isDragging: false };

  // Dragging logic
  private dragStart: { x: number, y: number } | null = null;
  private activeLayer: 'name' | 'id' | null = null;

  // FIX: Use inject() instead of constructor injection for services.
  private randomizer = inject(RandomizerService);

  constructor() {
    this.randomizeData();
    
    // Effect to initialize canvas when image and canvas element are ready
    effect(() => {
      const canvasEl = this.canvasRef()?.nativeElement;
      const img = this.baseImage();
      if (canvasEl && img) {
        this.initCanvas(canvasEl, img);
      }
    });

    // Effect to redraw when data or portrait image changes
    effect(() => {
      // Track all signals that should trigger a redraw
      this.nameText();
      this.idText();
      this.textColor();
      this.fontSize();
      this.rotation();

      // Redraw only if canvas is ready
      if (this.ctx) {
        this.draw();
      }
    });
  }

  ngOnInit() {
    this.loadDemoImage();
  }

  randomizeData() {
    this.nameText.set(this.randomizer.getRandomName().toUpperCase());
    this.idText.set(this.randomizer.getRandomId());
  }

  // --- File Handling ---

  openFilePicker() {
    this.fileInput().nativeElement.click();
  }

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

  private loadFile(file: File | string) {
    this.isLoading.set(true);
    this.imageLoaded.set(false);
    const img = new Image();
    img.crossOrigin = "Anonymous";

    img.onload = () => {
        this.imageLoaded.set(true);
        this.isLoading.set(false);
        // Reset positions to defaults on new image
        this.nameLayer.x = 0.51; this.nameLayer.y = 0.44;
        this.idLayer.x = 0.54; this.idLayer.y = 0.49;
        this.updateCoordsDisplay();
        this.baseImage.set(img);
    };
    img.onerror = () => {
        console.error('Failed to load image. Using generator.');
        this.isLoading.set(false);
        this.generateDemoCanvas();
    }

    if (typeof file === 'string') {
        img.src = file;
    } else {
        const reader = new FileReader();
        reader.onload = (e) => {
            img.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);
    }
  }

  loadDemoImage() {
    if (this.CUSTOM_BASE_IMAGE && this.CUSTOM_BASE_IMAGE.length > 5) {
      this.loadFile(this.CUSTOM_BASE_IMAGE);
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
      this.imageLoaded.set(true);
      this.baseImage.set(img);
    };
    img.src = canvas.toDataURL();
  }

  private initCanvas(canvas: HTMLCanvasElement, image: HTMLImageElement) {
    this.ctx = canvas.getContext('2d');
    canvas.width = image.width;
    canvas.height = image.height;
    this.draw();
  }

  private draw() {
    const image = this.baseImage();
    if (!this.ctx || !image) return;
    
    const w = this.ctx.canvas.width;
    const h = this.ctx.canvas.height;
    
    this.ctx.clearRect(0, 0, w, h);
    this.ctx.drawImage(image, 0, 0, w, h);

    // Update layer text from signals before drawing
    this.nameLayer.text = this.nameText();
    this.idLayer.text = this.idText();

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

  private getMousePos(event: MouseEvent) {
    const canvas = this.canvasRef()?.nativeElement;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY
    };
  }

  private isHit(layer: TextLayer, mx: number, my: number): boolean {
    const canvas = this.canvasRef()?.nativeElement;
    if (!this.ctx || !canvas) return false;
    const w = canvas.width;
    const h = canvas.height;
    const x = layer.x * w;
    const y = layer.y * h;
    const scaleFactor = w / 800; 
    const fontSize = this.fontSize() * scaleFactor;
    this.ctx.font = `bold ${fontSize}px "Courier Prime", monospace`;
    const metrics = this.ctx.measureText(layer.text);
    return (mx >= x && mx <= x + metrics.width && my >= y && my <= y + fontSize);
  }

  onMouseDown(event: MouseEvent) {
    if (!this.imageLoaded()) return;
    const pos = this.getMousePos(event);
    
    if (this.isHit(this.nameLayer, pos.x, pos.y)) {
      this.activeLayer = 'name';
      this.nameLayer.isDragging = true;
    // FIX: Changed 'y' to 'pos.y' to correctly reference the mouse position.
    } else if (this.isHit(this.idLayer, pos.x, pos.y)) {
      this.activeLayer = 'id';
      this.idLayer.isDragging = true;
    }

    if (this.activeLayer) {
      this.dragStart = pos;
      this.draw();
    }
  }

  updateLayerPos(event: MouseEvent) {
     const canvas = this.canvasRef()?.nativeElement;
     if (!this.activeLayer || !this.dragStart || !canvas) return;
     const pos = this.getMousePos(event);
     const dx = pos.x - this.dragStart.x;
     const dy = pos.y - this.dragStart.y;
     const w = canvas.width;
     const h = canvas.height;

     if (this.activeLayer === 'name') {
       this.nameLayer.x += dx / w;
       this.nameLayer.y += dy / h;
     } else if (this.activeLayer === 'id') {
       this.idLayer.x += dx / w;
       this.idLayer.y += dy / h;
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

  // --- Updates ---
  updateName(e: Event) { this.nameText.set((e.target as HTMLInputElement).value); }
  updateId(e: Event) { this.idText.set((e.target as HTMLInputElement).value); }
  updateColor(e: Event) { this.textColor.set((e.target as HTMLInputElement).value); }
  updateFontSize(e: Event) { this.fontSize.set(Number((e.target as HTMLInputElement).value)); }
  updateRotation(e: Event) { this.rotation.set(Number((e.target as HTMLInputElement).value)); }
  
  onMouseUp() {
    if (this.activeLayer) {
      if (this.activeLayer === 'name') this.nameLayer.isDragging = false;
      if (this.activeLayer === 'id') this.idLayer.isDragging = false;
      this.activeLayer = null;
      this.draw();
    }
  }

  downloadImage() {
    const canvas = this.canvasRef()?.nativeElement;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `id-card-${this.idText()}.png`;
    link.href = canvas.toDataURL();
    link.click();
  }
}
