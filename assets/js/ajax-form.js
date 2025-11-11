$(function() {
    // Elementos del formulario
    const form = $('#contact-form');
    const formMessages = $('.ajax-response');
    const submitButton = form.find('button[type="submit"]');
    
    // Función para mostrar mensajes
    const showMessage = (message, isError = false) => {
        formMessages
            .removeClass('success error')
            .addClass(isError ? 'error' : 'success')
            .text(message)
            .fadeIn();
    };

    // Función para resetear el formulario
    const resetForm = () => {
        form[0].reset();
        submitButton.prop('disabled', false);
    };

    // Manejar el envío del formulario
    form.submit(function(e) {
        e.preventDefault();
        
        // Deshabilitar el botón mientras se envía
        submitButton.prop('disabled', true);
        
        // Mostrar mensaje de carga
        showMessage('Enviando mensaje...');

        // Preparar los datos del formulario
        const formData = $(this).serialize();

        // Enviar mediante AJAX
        $.ajax({
            type: 'POST',
            url: $(this).attr('action'),
            data: formData,
            dataType: 'json'
        })
        .done(function(response) {
            if (response.status === 'success') {
                showMessage(response.message);
                resetForm();
            } else {
                showMessage(response.message, true);
            }

			// Clear the form.
			$('#contact-form input,#contact-form textarea').val('');
		})
		.fail(function(data) {
			// Make sure that the formMessages div has the 'error' class.
			$(formMessages).removeClass('success');
			$(formMessages).addClass('error');

			// Set the message text.
			if (data.responseText !== '') {
				$(formMessages).text(data.responseText);
			} else {
				$(formMessages).text('Oops! An error occured and your message could not be sent.');
			}
		});
	});

});
