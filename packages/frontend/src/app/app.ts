import { Component } from '@angular/core';
import { TodoListComponent } from './components/todo-list.component';

@Component({
  selector: 'app-root',
  imports: [TodoListComponent],
  template: `<app-todo-list></app-todo-list>`,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
  `]
})
export class App {}
