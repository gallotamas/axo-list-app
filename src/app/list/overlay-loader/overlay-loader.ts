import {
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  inject,
  input,
  OnDestroy,
  TemplateRef,
  ViewChild,
  ViewContainerRef
} from '@angular/core';
import { Overlay, OverlayModule, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'axo-overlay-loader',
  imports: [OverlayModule, MatProgressSpinnerModule],
  templateUrl: './overlay-loader.html',
  styleUrl: './overlay-loader.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OverlayLoader implements OnDestroy {
  @ViewChild('loaderTemplate', { static: true })
  private loaderTemplate!: TemplateRef<unknown>;
  private overlay = inject(Overlay);
  private overlayRef?: OverlayRef;
  private viewContainerRef = inject(ViewContainerRef);

  target = input.required<ElementRef<HTMLElement>>();
  isVisible = input.required<boolean>();
  message = input<string>('Loading...');
  spinnerDiameter = input<number>(75);

  constructor() {
    effect(() => {
      if (this.isVisible()) {
        this.showOverlay();
      } else {
        this.hideOverlay();
      }
    });
  }

  ngOnDestroy(): void {
    this.hideOverlay();
  }

  private showOverlay(): void {
    if (this.overlayRef) {
      return;
    }

    const targetElement = this.target();
    if (!targetElement || !this.loaderTemplate) {
      return;
    }

    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(targetElement)
      .withPositions([
        {
          originX: 'center',
          originY: 'center',
          overlayX: 'center',
          overlayY: 'center',
        }
      ]);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      width: targetElement.nativeElement.offsetWidth + 'px',
      height: targetElement.nativeElement.offsetHeight + 'px',
    });

    const portal = new TemplatePortal(this.loaderTemplate, this.viewContainerRef);
    this.overlayRef.attach(portal);
  }

  private hideOverlay(): void {
    if (this.overlayRef) {
      this.overlayRef.detach();
      this.overlayRef.dispose();
      this.overlayRef = undefined;
    }
  }
}
