<?php

class TasksController extends Controller
{
    public function index()
    {
        $this->view('tasks/index');
    }
}