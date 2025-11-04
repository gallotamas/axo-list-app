import { Component, output, input, ChangeDetectionStrategy, effect } from '@angular/core';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'axo-scroll-controls',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './scroll-controls.html',
  styleUrl: './scroll-controls.scss',
})
export class ScrollControls {
  maxRowId = input<number>(0);
  scrollToRowClicked = output<number>();

  protected scrollToRowControl = new FormControl<number>(0, { nonNullable: true });

  constructor() {
    effect(() => {
      const max = this.maxRowId();
      this.scrollToRowControl.setValidators([
        Validators.required,
        Validators.min(0),
        Validators.max(max),
      ]);
      this.scrollToRowControl.updateValueAndValidity();
    });
  }

  onScrollToRow(): void {
    if (this.scrollToRowControl.valid) {
      this.scrollToRowClicked.emit(this.scrollToRowControl.value);
    }
  }
}
