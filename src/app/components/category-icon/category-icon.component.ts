import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type IconSize = 'sm' | 'md' | 'lg';
export type IconVariant = 'solid' | 'light';

@Component({
  selector: 'app-category-icon',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './category-icon.component.html',
  styleUrl: './category-icon.component.scss',
})
export class CategoryIconComponent {
  @Input({ required: true }) icon!: string;
  @Input({ required: true }) color!: string;
  @Input() size: IconSize = 'md';
  @Input() variant: IconVariant = 'solid';

  get containerStyle() {
    if (this.variant === 'solid') {
      return {
        'background-color': this.color,
        color: 'white',
      };
    } else {
      return {
        'background-color': this.color + '20',
        color: this.color,
      };
    }
  }
}
