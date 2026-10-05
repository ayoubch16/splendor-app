<?php

// app/Mail/GenericEmailWithAttachment.php
namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class GenericEmailWithAttachment extends Mailable
{
    use Queueable, SerializesModels;

    public $subjectText;
    public $messageText;
    public $pdfContent;
    public $pdfFileName;

    public function __construct($subject, $message, $pdfContent, $pdfFileName)
    {
        $this->subjectText = $subject;
        $this->messageText = $message;
        $this->pdfContent = $pdfContent;
        $this->pdfFileName = $pdfFileName;
    }

    public function build()
    {
        return $this->subject($this->subjectText)
                    ->html(nl2br(e($this->messageText)))
                    ->attachData($this->pdfContent, $this->pdfFileName, [
                        'mime' => 'application/pdf',
                    ]);
    }
}