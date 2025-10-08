import { AfterViewInit, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

declare const Swiper: any;

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements AfterViewInit {
  ngAfterViewInit(): void {
    // Feature tabs
    const featureTags = document.querySelectorAll('.feature-tag');
    const contentBlocks = document.querySelectorAll('.content-block');
    const phoneMockups = document.querySelectorAll('.phone-mockup');
    featureTags.forEach(tagEl => {
      const el = tagEl as HTMLElement;
      el.addEventListener('click', () => {
        const category = el.getAttribute('data-category');
        featureTags.forEach(x => x.classList.remove('active'));
        contentBlocks.forEach(x => x.classList.remove('active'));
        phoneMockups.forEach(x => x.classList.remove('active'));
        el.classList.add('active');
        const contentToShow = category ? document.getElementById(category) : null;
        contentToShow?.classList.add('active');
        const imageToShow = category ? document.getElementById('img-' + category) : null;
        imageToShow?.classList.add('active');
        if (window.innerWidth <= 768 && imageToShow) {
          imageToShow.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });

    // Swiper init
    try {
      if (typeof Swiper !== 'undefined') {
        new Swiper('.hero-slider', {
          loop: true,
          autoplay: { delay: 3000, disableOnInteraction: false },
          pagination: { el: '.slider-dots', clickable: true },
          effect: 'slide',
          speed: 600,
          spaceBetween: 0,
          centeredSlides: true
        });
      }
    } catch {}
  }
}


