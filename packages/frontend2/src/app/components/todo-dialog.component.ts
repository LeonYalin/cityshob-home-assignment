import { Component, inject, signal, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { type Todo } from '@real-time-todo/common';
import { MatButtonModule } from '@angular/material/button';

export interface TodoDialogData {
  mode: 'create' | 'edit';
  todo?: Todo;
}

@Component({
  selector: 'app-todo-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule
  ],
  template: `
    <div class="dialog-container">
      <h2 mat-dialog-title>
        <mat-icon>{{ isEditMode() ? 'edit' : 'add' }}</mat-icon>
        {{ isEditMode() ? 'Edit Todo' : 'Create New Todo' }}
      </h2>

      <form [formGroup]="todoForm" (ngSubmit)="onSubmit()">
        <mat-dialog-content>
          <div class="form-fields">
            <!-- Title Field -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Title</mat-label>
              <input 
                matInput 
                formControlName="title" 
                placeholder="Enter todo title"
                maxlength="100"
              >
              <mat-hint align="end">{{ todoForm.get('title')?.value?.length || 0 }}/100</mat-hint>
              <mat-error *ngIf="todoForm.get('title')?.hasError('required')">
                Title is required
              </mat-error>
              <mat-error *ngIf="todoForm.get('title')?.hasError('minlength')">
                Title must be at least 3 characters long
              </mat-error>
            </mat-form-field>

            <!-- Description Field -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Description</mat-label>
              <textarea 
                matInput 
                formControlName="description" 
                placeholder="Enter todo description (optional)"
                rows="3"
                maxlength="500"
              ></textarea>
              <mat-hint align="end">{{ todoForm.get('description')?.value?.length || 0 }}/500</mat-hint>
            </mat-form-field>

            <!-- Priority Field -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Priority</mat-label>
              <mat-select formControlName="priority">
                <mat-select-trigger>
                  <div class="priority-option" [ngClass]="todoForm.get('priority')?.value">
                    <mat-icon>{{ getPriorityIcon(todoForm.get('priority')?.value) }}</mat-icon>
                    {{ getPriorityLabel(todoForm.get('priority')?.value) }}
                  </div>
                </mat-select-trigger>
                <mat-option value="low">
                  <div class="priority-option low">
                    <mat-icon>low_priority</mat-icon>
                    Low Priority
                  </div>
                </mat-option>
                <mat-option value="medium">
                  <div class="priority-option medium">
                    <mat-icon>priority_high</mat-icon>
                    Medium Priority
                  </div>
                </mat-option>
                <mat-option value="high">
                  <div class="priority-option high">
                    <mat-icon>warning</mat-icon>
                    High Priority
                  </div>
                </mat-option>
              </mat-select>
            </mat-form-field>
          </div>
        </mat-dialog-content>

        <mat-dialog-actions align="end">
          <button 
            mat-button 
            type="button" 
            (click)="onCancel()"
            class="cancel-button"
          >
            Cancel
          </button>
          <button 
            mat-raised-button 
            color="primary" 
            type="submit"
            [disabled]="todoForm.invalid || isSubmitting()"
            class="submit-button"
          >
            <mat-icon>{{ isEditMode() ? 'save' : 'add' }}</mat-icon>
            {{ isEditMode() ? 'Save Changes' : 'Create Todo' }}
          </button>
        </mat-dialog-actions>
      </form>
    </div>
  `,
  styles: [`
    .dialog-container {
      padding: 8px;
    }

    h2[mat-dialog-title] {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
      color: #333;
    }

    .form-fields {
      display: flex;
      flex-direction: column;
      gap: 16px;
      min-width: 400px;
      padding: 8px 0;
    }

    .full-width {
      width: 100%;
    }

    .priority-option {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .priority-option.low mat-icon {
      color: #4caf50;
    }

    .priority-option.medium mat-icon {
      color: #ff9800;
    }

    .priority-option.high mat-icon {
      color: #f44336;
    }

    mat-dialog-actions {
      gap: 8px;
      padding: 16px 0 8px 0;
    }

    .submit-button {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .cancel-button {
      color: #666;
    }

    /* Custom snackbar styles (global) */
    :host ::ng-deep .success-snackbar {
      background-color: #4caf50;
      color: white;
    }

    :host ::ng-deep .error-snackbar {
      background-color: #f44336;
      color: white;
    }

    /* Responsive design */
    @media (max-width: 600px) {
      .form-fields {
        min-width: 300px;
      }
      
      h2[mat-dialog-title] {
        font-size: 1.2rem;
      }
    }
  `]
})
export class TodoDialogComponent {
  protected readonly isSubmitting = signal(false);
  protected readonly isEditMode = signal(false);
  
  protected readonly todoForm: FormGroup;
  
  private readonly dialogRef = inject(MatDialogRef<TodoDialogComponent>);
  private readonly fb = inject(FormBuilder);

  constructor(@Inject(MAT_DIALOG_DATA) private readonly data: TodoDialogData) {
    this.isEditMode.set(this.data.mode === 'edit');
    
    // Initialize form with validation
    this.todoForm = this.fb.group({
      title: [
        this.data.todo?.title || '', 
        [Validators.required, Validators.minLength(3), Validators.maxLength(100)]
      ],
      description: [
        this.data.todo?.description || '', 
        [Validators.maxLength(500)]
      ],
      priority: [
        this.data.todo?.priority || 'medium', 
        [Validators.required]
      ]
    });
  }

  onSubmit() {
    if (this.todoForm.valid && !this.isSubmitting()) {
      this.isSubmitting.set(true);
      
      const formValue = this.todoForm.value;
      
      // Clean up the form data
      const todoData = {
        title: formValue.title.trim(),
        description: formValue.description?.trim() || undefined,
        priority: formValue.priority
      };

      // Remove empty description
      if (!todoData.description) {
        delete todoData.description;
      }

      // Simulate slight delay for better UX
      setTimeout(() => {
        this.dialogRef.close(todoData);
      }, 200);
    }
  }

  onCancel() {
    this.dialogRef.close();
  }

  getPriorityIcon(priority: string): string {
    switch (priority) {
      case 'low': return 'low_priority';
      case 'medium': return 'priority_high';
      case 'high': return 'warning';
      default: return 'priority_high';
    }
  }

  getPriorityLabel(priority: string): string {
    switch (priority) {
      case 'low': return 'Low Priority';
      case 'medium': return 'Medium Priority';
      case 'high': return 'High Priority';
      default: return 'Medium Priority';
    }
  }
}