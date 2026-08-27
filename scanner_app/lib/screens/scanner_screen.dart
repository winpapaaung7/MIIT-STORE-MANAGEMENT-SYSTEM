import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

import '../services/accessory_service.dart';
import 'accessory_detail_screen.dart';

class ScannerScreen extends StatefulWidget {
  const ScannerScreen({super.key});

  @override
  State<ScannerScreen> createState() => _ScannerScreenState();
}

class _ScannerScreenState extends State<ScannerScreen> {
  final MobileScannerController _controller = MobileScannerController(
    // An empty formats list tells mobile_scanner to accept every supported
    // barcode format. Inventory labels may be printed as QR, Code 128, EAN,
    // or another conventional barcode, so restricting this to QR made valid
    // labels appear unscannable on the phone.
    formats: const <BarcodeFormat>[],
  );
  final AccessoryService _accessoryService = AccessoryService();
  bool _isLookingUpAccessory = false;
  String? _errorMessage;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _onDetect(BarcodeCapture capture) async {
    if (_isLookingUpAccessory) return;

    final qrCode = capture.barcodes.firstOrNull?.rawValue?.trim();
    if (qrCode == null || qrCode.isEmpty) {
      setState(
        () =>
            _errorMessage = 'This QR code or barcode does not contain an accessory code.',
      );
      return;
    }

    setState(() {
      _isLookingUpAccessory = true;
      _errorMessage = null;
    });
    await _controller.stop();

    try {
      final accessory = await _accessoryService.getByCode(qrCode);
      if (!mounted) return;

      await Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) => AccessoryDetailScreen(accessory: accessory),
        ),
      );
    } on AccessoryNotFoundException {
      if (mounted) {
        setState(() => _errorMessage = 'Accessory not found for code: $qrCode');
      }
    } on AccessoryConnectionException {
      if (mounted) {
        setState(
          () => _errorMessage =
              'Cannot connect to the store server. Check the network and try again.',
        );
      }
    } on AccessoryServerException {
      if (mounted) {
        setState(
          () => _errorMessage =
              'The store server could not process this request. Please try again.',
        );
      }
    } catch (_) {
      if (mounted) {
        setState(() => _errorMessage = 'Unable to load accessory details.');
      }
    } finally {
      if (mounted) {
        setState(() => _isLookingUpAccessory = false);
        await _controller.start();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('MIIT Store Scanner'),
      ),
      body: Column(
        children: [
          Expanded(
            child: Stack(
              fit: StackFit.expand,
              children: [
                MobileScanner(
                  controller: _controller,
                  onDetect: _onDetect,
                  errorBuilder: (context, error) {
                    final message =
                        error.errorCode ==
                            MobileScannerErrorCode.permissionDenied
                        ? 'Camera permission was denied. Allow camera access in Android settings, then reopen the app.'
                        : 'The camera is unavailable. Please try again.';
                    return Center(
                      child: Padding(
                        padding: const EdgeInsets.all(24),
                        child: Text(message, textAlign: TextAlign.center),
                      ),
                    );
                  },
                ),
                const IgnorePointer(child: Center(child: _ScannerFrame())),
              ],
            ),
          ),
          SafeArea(
            top: false,
            child: Container(
              width: double.infinity,
              color: const Color(0xFFF6FAF8),
              padding: const EdgeInsets.all(24),
              child: _isLookingUpAccessory
                  ? const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        ),
                        SizedBox(width: 12),
                        Text('Looking up accessory...'),
                      ],
                    )
                  : Text(
                      _errorMessage ?? 'Place the QR code or barcode inside the frame.',
                      textAlign: TextAlign.center,
                    ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ScannerFrame extends StatelessWidget {
  const _ScannerFrame();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 250,
      height: 250,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFF0F172A), width: 3),
        boxShadow: const [BoxShadow(color: Color(0x33000000), blurRadius: 12)],
      ),
      child: Align(
        alignment: Alignment.bottomCenter,
        child: Container(
          width: double.infinity,
          margin: const EdgeInsets.all(16),
          height: 2,
          color: const Color(0xFF93C5FD),
        ),
      ),
    );
  }
}
