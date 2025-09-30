<?php

class Controller
{
    public function view($view, $data = [])
    {
        extract($data);
        require "app/views/$view.php";
    }
}
