<?php

namespace App\Services;

use App\Models\OfficeNote;
use ZipArchive;

class WordNoteService
{
    public const TYPE_LABELS = [
        'general' => 'General',
        'memorando' => 'Memorando',
        'minuta' => 'Minuta',
        'oficio' => 'Oficio',
        'comunicado' => 'Comunicado',
        'otro' => 'Otro',
    ];

    public const STATUS_LABELS = [
        'draft' => 'Borrador',
        'final' => 'Final',
    ];

    /**
     * Genera el contenido binario de un documento Word (.docx) real.
     */
    public function build(OfficeNote $note): string
    {
        $zip = new ZipArchive();
        $temp = tempnam(sys_get_temp_dir(), 'note_') . '.docx';

        if ($zip->open($temp, ZipArchive::CREATE) !== true) {
            throw new \RuntimeException('No se pudo crear el documento Word.');
        }

        $zip->addFromString('[Content_Types].xml', $this->contentTypes());
        $zip->addFromString('_rels/.rels', $this->rels());
        $zip->addFromString('word/document.xml', $this->documentXml($note));
        $zip->close();

        $content = file_get_contents($temp);
        @unlink($temp);

        if ($content === false) {
            throw new \RuntimeException('No se pudo leer el documento Word generado.');
        }

        return $content;
    }

    public function filename(OfficeNote $note): string
    {
        $slug = preg_replace('/[^\w\d\-_]+/', '_', mb_strtolower($note->title));
        return ($note->note_number ?? 'nota') . '-' . substr($slug, 0, 40) . '.docx';
    }

    protected function contentTypes(): string
    {
        return <<<'XML'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>
XML;
    }

    protected function rels(): string
    {
        return <<<'XML'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>
XML;
    }

    protected function documentXml(OfficeNote $note): string
    {
        $type = self::TYPE_LABELS[$note->note_type] ?? $note->note_type;
        $status = self::STATUS_LABELS[$note->status] ?? $note->status;
        $author = $note->creator?->name ?? '—';
        $date = $note->note_date ? $note->note_date->format('d/m/Y') : '—';

        $body = '';
        $body .= $this->p($this->run('CALIZA LOS OSOS', ['bold' => true, 'size' => 40, 'color' => '1F3864']), ['align' => 'center']);
        $body .= $this->p($this->run(strtoupper('Nota de oficina · ' . $type), ['size' => 26, 'color' => '404040']), ['align' => 'center', 'spacing' => ['after' => 200]]);
        $body .= $this->p('', ['borderBottom' => '1F3864', 'spacing' => ['after' => 300]]);

        $body .= $this->p(
            $this->run('Número: ', ['bold' => true]) . $this->run($note->note_number ?? '—') .
            $this->run("\tFecha: ", ['bold' => true]) . $this->run($date)
        );
        $body .= $this->p(
            $this->run('Elaborada por: ', ['bold' => true]) . $this->run($author) .
            $this->run("\tEstado: ", ['bold' => true]) . $this->run($status)
        );

        if ($note->related_to) {
            $body .= $this->p(
                $this->run('Referente a: ', ['bold' => true]) . $this->run($note->related_to)
            );
        }

        $body .= $this->p('', ['spacing' => ['before' => 400, 'after' => 200]]);
        $body .= $this->p($this->run($note->title, ['bold' => true, 'size' => 32, 'color' => '1F3864']), ['align' => 'center', 'spacing' => ['after' => 300]]);
        $body .= $this->p($this->run($note->body, ['size' => 24]), ['spacing' => ['after' => 400, 'line' => 360]]);

        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            . '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
            . '<w:body>' . $body . '<w:sectPr/>' . '</w:body>'
            . '</w:document>';
    }

    protected function xml(string $text): string
    {
        return htmlspecialchars($text, ENT_XML1 | ENT_QUOTES, 'UTF-8');
    }

    protected function run(string $text, array $opts = []): string
    {
        $rpr = '<w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/>';
        if (!empty($opts['bold'])) {
            $rpr .= '<w:b/>';
        }
        if (!empty($opts['italic'])) {
            $rpr .= '<w:i/>';
        }
        if (!empty($opts['size'])) {
            $rpr .= '<w:sz w:val="' . (int) $opts['size'] . '"/><w:szCs w:val="' . (int) $opts['size'] . '"/>';
        }
        if (!empty($opts['color'])) {
            $rpr .= '<w:color w:val="' . $opts['color'] . '"/>';
        }
        return '<w:r><w:rPr>' . $rpr . '</w:rPr><w:t xml:space="preserve">' . $this->xml($text) . '</w:t></w:r>';
    }

    protected function p(string $runs, array $opts = []): string
    {
        $ppr = '';
        if (!empty($opts['align'])) {
            $ppr .= '<w:jc w:val="' . $opts['align'] . '"/>';
        }
        if (!empty($opts['spacing'])) {
            $s = $opts['spacing'];
            $ppr .= '<w:spacing w:before="' . ($s['before'] ?? 0) . '" w:after="' . ($s['after'] ?? 0) . '"'
                . ' w:line="' . ($s['line'] ?? 240) . '" w:lineRule="auto"/>';
        }
        if (!empty($opts['borderBottom'])) {
            $ppr .= '<w:pBdr><w:bottom w:val="single" w:sz="6" w:space="1" w:color="' . $opts['borderBottom'] . '"/></w:pBdr>';
        }
        return '<w:p>' . ($ppr ? '<w:pPr>' . $ppr . '</w:pPr>' : '') . $runs . '</w:p>';
    }
}
