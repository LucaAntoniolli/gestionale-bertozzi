/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { CollaudiComponent } from './collaudi.component';

describe('CollaudiComponent', () => {
  let component: CollaudiComponent;
  let fixture: ComponentFixture<CollaudiComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CollaudiComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CollaudiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
