import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class RandomizerService {

  private firstNames = [
    'Jean', 'Marie', 'Pierre', 'Sophie', 'Lucas', 'Camille', 'Thomas', 'Léa', 
    'Nicolas', 'Chloé', 'Julien', 'Manon', 'Antoine', 'Emma', 'David', 'Inès',
    'Gabriel', 'Sarah', 'Léo', 'Alice', 'Arthur', 'Juliette', 'Louis', 'Eva',
    'Carlos', 'Ana', 'Miguel', 'Lucia', 'Javier', 'Elena', 'Alejandro', 'Carmen'
  ];

  private lastNames = [
    'Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand',
    'Leroy', 'Moreau', 'Simon', 'Laurent', 'Lefebvre', 'Michel', 'Garcia', 'David',
    'Rodriguez', 'Lopez', 'Sanchez', 'Perez', 'Gomez', 'Fernandez', 'Diaz', 'Torres'
  ];

  getRandomName(): string {
    const first = this.firstNames[Math.floor(Math.random() * this.firstNames.length)];
    const last = this.lastNames[Math.floor(Math.random() * this.lastNames.length)];
    return `${first} ${last}`;
  }

  getRandomId(): string {
    // Format: 8-9 digits + dash + Letter (e.g., 12345678-A)
    const digitsCount = 8 + Math.floor(Math.random() * 2); // 8 or 9 digits
    let idNum = '';
    for (let i = 0; i < digitsCount; i++) {
      idNum += Math.floor(Math.random() * 10).toString();
    }
    
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const letter = letters.charAt(Math.floor(Math.random() * letters.length));
    
    return `${idNum}-${letter}`;
  }
}
