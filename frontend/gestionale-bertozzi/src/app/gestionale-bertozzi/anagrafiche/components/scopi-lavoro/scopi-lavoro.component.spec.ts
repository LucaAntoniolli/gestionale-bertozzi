import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmationService, MessageService } from 'primeng/api';

import { ScopiLavoroComponent } from './scopi-lavoro.component';

describe('ScopiLavoroComponent', () => {
  let component: ScopiLavoroComponent;
  let fixture: ComponentFixture<ScopiLavoroComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScopiLavoroComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideZonelessChangeDetection(),
        ConfirmationService,
        MessageService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ScopiLavoroComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
