<?php

class HomeController extends Controller
{
    public function index()
    {
        $this->view('home/index', ['message' => 'Привіт з MVC!']);
    }
}
