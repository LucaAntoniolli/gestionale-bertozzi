/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { ScopiLavoroComponent } from './scopi-lavoro.component';

describe('ScopiLavoroComponent', () => {
  let component: ScopiLavoroComponent;
  let fixture: ComponentFixture<ScopiLavoroComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ScopiLavoroComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ScopiLavoroComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
