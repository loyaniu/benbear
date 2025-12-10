import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-color-picker',
  standalone: true,
  template: `
    <div class="color-picker">
      @for (c of colors; track c) {
        <button
          type="button"
          class="color-option"
          [style.background-color]="c"
          [class.selected]="value === c"
          (click)="selectColor(c)"
          [attr.aria-label]="'Select color ' + c"
        ></button>
      }
    </div>
  `,
  styles: [
    `
      .color-picker {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        max-width: 200px;
      }

      .color-option {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 2px solid transparent;
        cursor: pointer;
        padding: 0;
        transition: transform 0.1s ease;

        &.selected {
          border-color: var(--ion-color-dark);
          transform: scale(1.15);
        }
      }
    `,
  ],
})
export class ColorPickerComponent {
  @Input({ required: true }) colors!: readonly string[];
  @Input() value = '';
  @Output() valueChange = new EventEmitter<string>();

  selectColor(color: string) {
    this.value = color;
    this.valueChange.emit(color);
  }
}
