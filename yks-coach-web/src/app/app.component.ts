import { Component, AfterViewInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ChatWidgetComponent } from './components/chat-widget/chat-widget.component';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { siteConfig } from './site.config';
import { AuthService } from './services/auth.service';
declare const Swiper: any;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, MatToolbarModule, MatButtonModule, ChatWidgetComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements AfterViewInit {
  title = 'yks-coach-web';
  today = new Date();
  site = siteConfig;
  constructor(public auth: AuthService) {}

  ngAfterViewInit(): void {
    // Navbar hamburgers and dropdowns
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    const dropdown = document.querySelector('.dropdown');
    const dropdownToggle = document.querySelector('.dropdown-toggle');

    if (hamburger && navMenu) {
      hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
      });
    }
    if (dropdown && dropdownToggle) {
      dropdownToggle.addEventListener('click', (e: Event) => {
        e.preventDefault();
        if (window.innerWidth <= 768) dropdown.classList.toggle('active');
      });
      dropdownToggle.addEventListener('touchstart', (e: Event) => {
        if (window.innerWidth <= 768) {
          e.preventDefault();
          dropdown.classList.toggle('active');
        }
      }, { passive: false } as any);
    }
    document.querySelectorAll('.nav-link:not(.dropdown-toggle), .dropdown-item').forEach(link => {
      link.addEventListener('click', () => {
        hamburger?.classList.remove('active');
        navMenu?.classList.remove('active');
        dropdown?.classList.remove('active');
      });
    });
    document.addEventListener('click', (e: any) => {
      if (!e.target.closest('.navbar')) {
        hamburger?.classList.remove('active');
        navMenu?.classList.remove('active');
        dropdown?.classList.remove('active');
      }
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth > 768) {
        hamburger?.classList.remove('active');
        navMenu?.classList.remove('active');
        dropdown?.classList.remove('active');
      }
    });

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

    // Back to top
    const backToTopBtn = document.getElementById('backToTop');
    if (backToTopBtn) {
      window.addEventListener('scroll', () => {
        if (window.scrollY > 300) backToTopBtn.classList.add('visible');
        else backToTopBtn.classList.remove('visible');
      });
      backToTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    }

    // Swiper init (requires CDN script included in index.html)
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
