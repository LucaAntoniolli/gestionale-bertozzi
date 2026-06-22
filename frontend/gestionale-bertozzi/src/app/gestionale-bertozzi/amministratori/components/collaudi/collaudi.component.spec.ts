import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmationService, MessageService } from 'primeng/api';

import { CollaudiComponent } from './collaudi.component';

describe('CollaudiComponent', () => {
  let component: CollaudiComponent;
  let fixture: ComponentFixture<CollaudiComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CollaudiComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideZonelessChangeDetection(),
        ConfirmationService,
        MessageService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CollaudiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
